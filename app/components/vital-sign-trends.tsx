import {
  buildVitalSummaries,
  buildVitalTrends,
  formatVitalValue,
  type VitalPoint,
  type VitalTrend,
} from '../fhir/vital-signs';

const WIDTH = 520;
const HEIGHT = 220;
const PLOT = { left: 48, right: 14, top: 18, bottom: 36 };

export function VitalSignOverview(props: {
  observations: fhir4.Observation[];
}) {
  const trends = buildVitalTrends(props.observations);
  const summaries = buildVitalSummaries(trends);
  const chartable = trends.filter((trend) =>
    trend.series.some((series) => series.points.length > 1),
  );

  if (!summaries.length) return null;

  return (
    <div class="grid gap-4">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaries.map((summary) => (
          <article class="rounded-md border border-slate-200 bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {summary.label}
            </p>
            <p class="mt-2 text-xl font-semibold text-slate-950">
              {summary.value}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Latest · {formatDate(summary.date)}
            </p>
          </article>
        ))}
      </div>
      {chartable.length ? (
        <div class="grid gap-4 lg:grid-cols-2">
          {chartable.map((trend) => (
            <TrendChart trend={trend} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TrendChart(props: { trend: VitalTrend }) {
  const points = props.trend.series.flatMap((series) => series.points);
  const bounds = chartBounds(points);
  const titleId = `${props.trend.id}-trend-title`;
  const descriptionId = `${props.trend.id}-trend-description`;
  const datedPoints = points.sort(
    (left, right) => left.timestamp - right.timestamp,
  );

  return (
    <figure class="rounded-md border border-slate-200 bg-white p-4">
      <figcaption class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="font-semibold text-slate-950">{props.trend.label}</h3>
          <p class="mt-1 text-xs text-slate-500">
            Recent{' '}
            {Math.max(...props.trend.series.map((item) => item.points.length))}{' '}
            readings · {props.trend.unit}
          </p>
        </div>
        {props.trend.series.length > 1 ? (
          <div class="flex flex-wrap gap-3 text-xs text-slate-600">
            {props.trend.series.map((series) => (
              <span class="inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  class="h-2.5 w-2.5 rounded-full"
                  style={`background:${series.color}`}
                ></span>
                {series.label}
              </span>
            ))}
          </div>
        ) : null}
      </figcaption>
      <svg
        aria-labelledby={`${titleId} ${descriptionId}`}
        class="mt-3 h-auto w-full"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      >
        <title id={titleId}>{props.trend.label} trend</title>
        <desc id={descriptionId}>
          {props.trend.label} readings from {formatDate(datedPoints[0].date)} to{' '}
          {formatDate(datedPoints.at(-1)?.date)}.
        </desc>
        {[0, 0.5, 1].map((position) => {
          const y = PLOT.top + position * plotHeight();
          const value = bounds.max - position * (bounds.max - bounds.min);
          return (
            <g>
              <line
                stroke="#e2e8f0"
                stroke-width="1"
                x1={PLOT.left}
                x2={WIDTH - PLOT.right}
                y1={y}
                y2={y}
              />
              <text
                fill="#64748b"
                font-size="11"
                text-anchor="end"
                x={PLOT.left - 7}
                y={y + 4}
              >
                {formatVitalValue(value)}
              </text>
            </g>
          );
        })}
        {props.trend.series.map((series) => {
          const coordinates = series.points.map((point) => ({
            point,
            x: xPosition(point.timestamp, bounds),
            y: yPosition(point.value, bounds),
          }));
          return (
            <g>
              <polyline
                fill="none"
                points={coordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
                stroke={series.color}
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
              />
              {coordinates.map(({ point, x, y }) => (
                <circle cx={x} cy={y} fill={series.color} r="3.5">
                  <title>
                    {series.label}: {formatVitalValue(point.value)}{' '}
                    {props.trend.unit} on {formatDate(point.date)}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
        <text
          fill="#64748b"
          font-size="11"
          text-anchor="start"
          x={PLOT.left}
          y={HEIGHT - 8}
        >
          {formatShortDate(datedPoints[0].date)}
        </text>
        <text
          fill="#64748b"
          font-size="11"
          text-anchor="end"
          x={WIDTH - PLOT.right}
          y={HEIGHT - 8}
        >
          {formatShortDate(datedPoints.at(-1)?.date)}
        </text>
      </svg>
    </figure>
  );
}

function chartBounds(points: VitalPoint[]) {
  const values = points.map((point) => point.value);
  const timestamps = points.map((point) => point.timestamp);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding =
    rawMin === rawMax
      ? Math.max(Math.abs(rawMin) * 0.05, 1)
      : (rawMax - rawMin) * 0.15;
  return {
    min: rawMin - padding,
    max: rawMax + padding,
    start: Math.min(...timestamps),
    end: Math.max(...timestamps),
  };
}

function xPosition(timestamp: number, bounds: ReturnType<typeof chartBounds>) {
  const range = bounds.end - bounds.start;
  if (!range) return PLOT.left + plotWidth() / 2;
  return PLOT.left + ((timestamp - bounds.start) / range) * plotWidth();
}

function yPosition(value: number, bounds: ReturnType<typeof chartBounds>) {
  return (
    PLOT.top + ((bounds.max - value) / (bounds.max - bounds.min)) * plotHeight()
  );
}

function plotWidth() {
  return WIDTH - PLOT.left - PLOT.right;
}

function plotHeight() {
  return HEIGHT - PLOT.top - PLOT.bottom;
}

function formatDate(value: string | undefined) {
  if (!value) return 'Unknown date';
  return new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatShortDate(value: string | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}
