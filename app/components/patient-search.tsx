export function PatientSearch(props: { query?: string }) {
  return (
    <form
      action="/patients"
      class="flex flex-col gap-2 sm:flex-row"
      hx-get="/patients/results"
      hx-target="#patient-results"
      hx-swap="outerHTML"
      method="get"
    >
      <input
        class="field min-w-0 flex-1"
        type="search"
        name="name"
        value={props.query ?? ''}
        placeholder="Search by first, last, or partial name"
      />
      <button class="button-secondary" type="submit">
        Search
      </button>
      {props.query ? (
        <a class="button-secondary" href="/patients">
          Clear search
        </a>
      ) : null}
    </form>
  );
}
