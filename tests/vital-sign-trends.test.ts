import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { VitalSignOverview } from '../app/components/vital-sign-trends';
import {
  buildVitalSummaries,
  buildVitalTrends,
} from '../app/fhir/vital-signs';

describe('Vital-sign trends', () => {
  test('extracts LOINC-coded blood pressure and scalar series', () => {
    const observations = [
      bloodPressure('bp-old', '2025-01-01', 140, 90),
      scalar('hr-new', '8867-4', '2025-02-02', 72, '/min'),
      bloodPressure('bp-new', '2025-02-01', 128, 78),
      scalar('hr-old', '8867-4', '2025-01-02', 80, '/min'),
      scalar('spo2', '59408-5', '2025-02-02', 98, '%'),
      scalar('pain', '72514-3', '2025-02-03', 4, '{score}'),
    ];

    const trends = buildVitalTrends(observations);
    const bloodPressureTrend = trends.find(
      (trend) => trend.id === 'blood-pressure',
    );
    const heartRateTrend = trends.find((trend) => trend.id === 'heart-rate');

    assert.deepEqual(
      bloodPressureTrend?.series[0].points.map((point) => point.value),
      [140, 128],
    );
    assert.deepEqual(
      bloodPressureTrend?.series[1].points.map((point) => point.value),
      [90, 78],
    );
    assert.deepEqual(
      heartRateTrend?.series[0].points.map((point) => point.value),
      [80, 72],
    );
    assert.equal(trends.some((trend) => trend.id === 'pain'), false);

    assert.deepEqual(buildVitalSummaries(trends), [
      {
        id: 'blood-pressure',
        label: 'Blood pressure',
        value: '128/78 mmHg',
        date: '2025-02-01',
      },
      {
        id: 'heart-rate',
        label: 'Heart rate',
        value: '72 /min',
        date: '2025-02-02',
      },
      {
        id: 'oxygen-saturation',
        label: 'Oxygen saturation',
        value: '98 %',
        date: '2025-02-02',
      },
    ]);
  });

  test('limits charts to the twelve most recent readings', () => {
    const observations = Array.from({ length: 15 }, (_, index) =>
      scalar(
        `weight-${index}`,
        '29463-7',
        `2025-01-${String(index + 1).padStart(2, '0')}`,
        70 + index,
        'kg',
      ),
    );

    const weight = buildVitalTrends(observations).find(
      (trend) => trend.id === 'body-weight',
    );
    assert.equal(weight?.series[0].points.length, 12);
    assert.equal(weight?.series[0].points[0].value, 73);
    assert.equal(weight?.series[0].points.at(-1)?.value, 84);
  });

  test('renders accessible SVG titles and keeps raw trends lightweight', () => {
    const markup = String(
      VitalSignOverview({
        observations: [
          scalar('hr-1', '8867-4', '2025-01-01', 70, '/min'),
          scalar('hr-2', '8867-4', '2025-02-01', 75, '/min'),
        ],
      }),
    );

    assert.match(markup, /<svg[^>]+role="img"/);
    assert.match(markup, /aria-labelledby="heart-rate-trend-title/);
    assert.match(markup, /<title id="heart-rate-trend-title"/);
    assert.match(markup, /Heart rate: 75 \/min on/);
  });
});

function scalar(
  id: string,
  code: string,
  effectiveDateTime: string,
  value: number,
  unit: string,
): fhir4.Observation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    code: { coding: [{ system: 'http://loinc.org', code }] },
    effectiveDateTime,
    valueQuantity: { value, unit },
  };
}

function bloodPressure(
  id: string,
  effectiveDateTime: string,
  systolic: number,
  diastolic: number,
): fhir4.Observation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '85354-9' }],
    },
    effectiveDateTime,
    component: [
      component('8480-6', systolic),
      component('8462-4', diastolic),
    ],
  };
}

function component(code: string, value: number): fhir4.ObservationComponent {
  return {
    code: { coding: [{ system: 'http://loinc.org', code }] },
    valueQuantity: { value, unit: 'mmHg' },
  };
}
