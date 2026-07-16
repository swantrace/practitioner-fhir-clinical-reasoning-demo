import { demoScenarioForPatient } from '../cds/demo-scenarios';
import type { CdsCard, CdsCardsResult } from '../cds/types';
import { ErrorState } from './errors';

export function CdsCardsPanel(props: { patientId: string }) {
  return (
    <section
      class="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
      aria-labelledby="cds-heading"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Live clinical decision support
          </p>
          <h2 id="cds-heading" class="mt-1 text-lg font-semibold">
            Hypertension care-gap check
          </h2>
          <p class="mt-1 text-sm text-slate-600">
            HAPI evaluates the CQL rule when this patient chart opens.
          </p>
        </div>
        <span class="w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
          CDS Hooks · patient-view
        </span>
      </div>
      <div
        aria-live="polite"
        id="cds-cards"
        hx-post={`/api/patients/${encodeURIComponent(props.patientId)}/cds-cards`}
        hx-trigger="load, blood-pressure-recorded from:body"
        hx-swap="innerHTML"
      >
        <div
          class="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600"
          role="status"
        >
          Evaluating the hypertension CQL rule...
        </div>
      </div>
    </section>
  );
}

export function CdsCards(props: { result: CdsCardsResult; patientId: string }) {
  if (!props.result.ok) return <ErrorState message={props.result.message} />;
  if (!props.result.data.length) {
    return <NoCareGap patientId={props.patientId} />;
  }

  return (
    <div class="grid gap-3">
      {props.result.data.map((card) => (
        <CdsCardView card={card} patientId={props.patientId} />
      ))}
    </div>
  );
}

function CdsCardView(props: { card: CdsCard; patientId: string }) {
  const styles = indicatorStyles[props.card.indicator];

  return (
    <article
      class={`rounded-md border border-l-4 bg-white p-4 shadow-sm sm:p-5 ${styles.border}`}
    >
      <div class="flex flex-wrap items-center gap-2">
        <span
          class={`rounded px-2 py-1 text-xs font-semibold uppercase ${styles.badge}`}
        >
          {indicatorLabels[props.card.indicator]}
        </span>
        <h3 class="font-semibold text-slate-950">{props.card.summary}</h3>
      </div>
      {props.card.detail ? (
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          {props.card.detail}
        </p>
      ) : null}
      <p class="mt-3 text-xs text-slate-500">
        Source: {props.card.source.label}
      </p>
      {props.card.indicator === 'warning' ? (
        <div>
          <button
            class="button mt-4"
            hx-get={`/api/patients/${encodeURIComponent(props.patientId)}/blood-pressure`}
            hx-swap="innerHTML"
            hx-target="#blood-pressure-workflow"
            type="button"
          >
            Record blood pressure
          </button>
          <div id="blood-pressure-workflow"></div>
        </div>
      ) : null}
    </article>
  );
}

function NoCareGap(props: { patientId: string }) {
  const scenario = demoScenarioForPatient(props.patientId);
  const content =
    scenario?.id === 'care-gap'
      ? {
          title: 'Care gap resolved',
          detail:
            'A qualifying blood-pressure Observation is now available, so the CQL recommendation is no longer applicable.',
          styles: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        }
      : scenario?.id === 'documented-bp'
        ? {
            title: 'Up to date',
            detail:
              'Active hypertension and qualifying blood-pressure documentation were both found.',
            styles: 'border-teal-200 bg-teal-50 text-teal-900',
          }
        : scenario?.id === 'control'
          ? {
              title: 'Rule not applicable',
              detail:
                'No active hypertension condition was found for this control patient.',
              styles: 'border-slate-200 bg-white text-slate-700',
            }
          : {
              title: 'No active care gap detected',
              detail:
                'The hypertension blood-pressure rule returned no recommendation.',
              styles: 'border-teal-200 bg-teal-50 text-teal-900',
            };

  return (
    <div class={`rounded-md border px-4 py-4 ${content.styles}`} role="status">
      <div class="flex items-start gap-3">
        <span
          aria-hidden="true"
          class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-semibold shadow-sm"
        >
          ✓
        </span>
        <div>
          <h3 class="font-semibold">{content.title}</h3>
          <p class="mt-1 text-sm leading-6">{content.detail}</p>
        </div>
      </div>
    </div>
  );
}

const indicatorStyles = {
  info: { border: 'border-blue-300', badge: 'bg-blue-100 text-blue-800' },
  warning: { border: 'border-amber-400', badge: 'bg-amber-100 text-amber-900' },
  critical: { border: 'border-red-400', badge: 'bg-red-100 text-red-900' },
} as const;

const indicatorLabels = {
  info: 'Information',
  warning: 'Needs attention',
  critical: 'Critical',
} as const;
