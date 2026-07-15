import type { CdsCard, CdsCardsResult } from '../cds/types';
import { EmptyState, ErrorState } from './errors';

export function CdsCardsPanel(props: { patientId: string }) {
  return (
    <section class="grid gap-3" aria-labelledby="cds-heading">
      <div class="flex items-center justify-between">
        <h2 id="cds-heading" class="section-title">
          Clinical Decision Support
        </h2>
      </div>
      <div
        id="cds-cards"
        hx-post={`/api/patients/${encodeURIComponent(props.patientId)}/cds-cards`}
        hx-trigger="load"
        hx-swap="innerHTML"
      >
        <div class="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          Evaluating clinical rules...
        </div>
      </div>
    </section>
  );
}

export function CdsCards(props: { result: CdsCardsResult }) {
  if (!props.result.ok) return <ErrorState message={props.result.message} />;
  if (!props.result.data.length) {
    return (
      <EmptyState message="No clinical decision support recommendations." />
    );
  }

  return (
    <div class="grid gap-3">
      {props.result.data.map((card) => (
        <CdsCardView card={card} />
      ))}
    </div>
  );
}

function CdsCardView(props: { card: CdsCard }) {
  const styles = indicatorStyles[props.card.indicator];

  return (
    <article class={`rounded-md border bg-white p-4 ${styles.border}`}>
      <div class="flex flex-wrap items-center gap-2">
        <span
          class={`rounded px-2 py-1 text-xs font-semibold uppercase ${styles.badge}`}
        >
          {props.card.indicator}
        </span>
        <h3 class="text-sm font-semibold">{props.card.summary}</h3>
      </div>
      {props.card.detail ? (
        <p class="mt-2 text-sm text-slate-700">{props.card.detail}</p>
      ) : null}
      <p class="mt-3 text-xs text-slate-500">
        Source: {props.card.source.label}
      </p>
    </article>
  );
}

const indicatorStyles = {
  info: { border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  warning: { border: 'border-amber-300', badge: 'bg-amber-100 text-amber-900' },
  critical: { border: 'border-red-300', badge: 'bg-red-100 text-red-900' },
} as const;
