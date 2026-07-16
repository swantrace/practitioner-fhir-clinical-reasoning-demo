export function PatientResultsSkeleton(props: {
  query?: string;
  cursor?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (props.query) params.set('name', props.query);
  if (props.cursor) params.set('cursor', props.cursor);
  if (props.page && props.page > 1) params.set('page', String(props.page));
  const query = params.toString();

  return (
    <div
      id="patient-results"
      class="overflow-hidden rounded-md border border-slate-200 bg-white"
      hx-get={`/patients/results${query ? `?${query}` : ''}`}
      hx-trigger="load"
      hx-swap="outerHTML"
    >
      <div class="border-b border-slate-200 bg-slate-100 px-4 py-3">
        <div class="h-3 w-32 animate-pulse rounded bg-slate-300"></div>
      </div>
      <div class="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            class="grid grid-cols-5 gap-4 px-4 py-3"
            aria-hidden="true"
            key={index}
          >
            <Bar class="col-span-2" />
            <Bar />
            <Bar />
            <Bar />
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar(props: { class?: string }) {
  return (
    <div
      class={`h-4 animate-pulse rounded bg-slate-200 ${props.class ?? ''}`}
    ></div>
  );
}
