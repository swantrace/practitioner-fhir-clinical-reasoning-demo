export type VitalPoint = {
  date: string;
  timestamp: number;
  value: number;
};

export type VitalSeries = {
  label: string;
  color: string;
  points: VitalPoint[];
};

export type VitalTrend = {
  id: string;
  label: string;
  unit: string;
  series: VitalSeries[];
};

export type VitalSummary = {
  id: string;
  label: string;
  value: string;
  date: string;
};

const MAX_TREND_POINTS = 12;
const scalarMetrics = [
  {
    id: 'heart-rate',
    label: 'Heart rate',
    unit: '/min',
    codes: ['8867-4'],
    color: '#0f766e',
  },
  {
    id: 'body-temperature',
    label: 'Temperature',
    unit: '°C',
    codes: ['8310-5'],
    color: '#c2410c',
  },
  {
    id: 'respiratory-rate',
    label: 'Respiratory rate',
    unit: '/min',
    codes: ['9279-1'],
    color: '#0369a1',
  },
  {
    id: 'oxygen-saturation',
    label: 'Oxygen saturation',
    unit: '%',
    codes: ['2708-6', '59408-5'],
    color: '#7c3aed',
  },
  {
    id: 'body-height',
    label: 'Height',
    unit: 'cm',
    codes: ['8302-2'],
    color: '#047857',
  },
  {
    id: 'body-weight',
    label: 'Weight',
    unit: 'kg',
    codes: ['29463-7'],
    color: '#a16207',
  },
  {
    id: 'body-mass-index',
    label: 'BMI',
    unit: 'kg/m²',
    codes: ['39156-5'],
    color: '#be185d',
  },
] as const;

export function buildVitalTrends(observations: fhir4.Observation[]) {
  const trends = [bloodPressureTrend(observations)];

  for (const metric of scalarMetrics) {
    const points = observations
      .filter((observation) =>
        metric.codes.some((code) => hasCode(observation.code, code)),
      )
      .map(quantityPoint)
      .filter((point): point is VitalPoint => Boolean(point));
    trends.push({
      id: metric.id,
      label: metric.label,
      unit: metric.unit,
      series: [
        {
          label: metric.label,
          color: metric.color,
          points: recent(points),
        },
      ],
    });
  }

  return trends.filter((trend) =>
    trend.series.some((series) => series.points.length),
  );
}

export function buildVitalSummaries(trends: VitalTrend[]): VitalSummary[] {
  return trends.flatMap((trend) => {
    const latest = trend.series.map((series) => series.points.at(-1));
    if (latest.some((point) => !point)) return [];

    const points = latest as VitalPoint[];
    const value =
      trend.id === 'blood-pressure'
        ? `${formatValue(points[0].value)}/${formatValue(points[1].value)} ${trend.unit}`
        : `${formatValue(points[0].value)} ${trend.unit}`;
    const newest = points.reduce((left, right) =>
      left.timestamp >= right.timestamp ? left : right,
    );

    return [{ id: trend.id, label: trend.label, value, date: newest.date }];
  });
}

export function formatVitalValue(value: number) {
  return formatValue(value);
}

function bloodPressureTrend(observations: fhir4.Observation[]): VitalTrend {
  const systolic: VitalPoint[] = [];
  const diastolic: VitalPoint[] = [];

  for (const observation of observations) {
    const date = observationDate(observation);
    const systolicValue = componentValue(observation, '8480-6');
    const diastolicValue = componentValue(observation, '8462-4');
    if (!date || systolicValue === undefined || diastolicValue === undefined) {
      continue;
    }

    systolic.push({ ...date, value: systolicValue });
    diastolic.push({ ...date, value: diastolicValue });
  }

  return {
    id: 'blood-pressure',
    label: 'Blood pressure',
    unit: 'mmHg',
    series: [
      { label: 'Systolic', color: '#0f766e', points: recent(systolic) },
      { label: 'Diastolic', color: '#c2410c', points: recent(diastolic) },
    ],
  };
}

function quantityPoint(observation: fhir4.Observation) {
  const date = observationDate(observation);
  const value = observation.valueQuantity?.value;
  return date && typeof value === 'number' && Number.isFinite(value)
    ? { ...date, value }
    : undefined;
}

function observationDate(observation: fhir4.Observation) {
  const date =
    observation.effectiveDateTime ??
    observation.effectivePeriod?.start ??
    observation.issued;
  if (!date) return undefined;

  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp) ? { date, timestamp } : undefined;
}

function componentValue(observation: fhir4.Observation, code: string) {
  const value = observation.component?.find((component) =>
    hasCode(component.code, code),
  )?.valueQuantity?.value;
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function hasCode(concept: fhir4.CodeableConcept | undefined, code: string) {
  return concept?.coding?.some(
    (coding) => coding.system === 'http://loinc.org' && coding.code === code,
  );
}

function recent(points: VitalPoint[]) {
  return [...points]
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-MAX_TREND_POINTS);
}

function formatValue(value: number) {
  return new Intl.NumberFormat('en-CA', {
    maximumFractionDigits: 1,
  }).format(value);
}
