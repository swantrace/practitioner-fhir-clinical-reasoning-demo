import { patientName } from '../fhir/format';
import { EmptyState, ErrorState } from './errors';

type PatientTableProps = {
  patients?: fhir4.Patient[];
  error?: string;
  name?: string;
  nextCursor?: string;
  page?: number;
  previousCursor?: string;
  total?: number;
};

export function PatientTable(props: PatientTableProps) {
  if (props.error) {
    return (
      <div id="patient-results">
        <ErrorState message={props.error} />
      </div>
    );
  }

  if (!props.patients?.length) {
    return (
      <div id="patient-results">
        <EmptyState message="No patients found." />
      </div>
    );
  }

  return (
    <div
      id="patient-results"
      class="overflow-hidden rounded-md border border-slate-200 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-100 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Gender</th>
              <th class="px-4 py-3">Date of birth</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {props.patients.map((patient) => (
              <tr>
                <td class="px-4 py-3 font-medium">
                  <a href={`/patients/${patient.id}`}>{patientName(patient)}</a>
                </td>
                <td class="px-4 py-3 capitalize">
                  {patient.gender ?? 'Unknown'}
                </td>
                <td class="px-4 py-3">{patient.birthDate ?? 'Unknown'}</td>
                <td class="px-4 py-3">
                  {patient.active === false ? 'Inactive' : 'Active'}
                </td>
                <td class="px-4 py-3 text-right">
                  <a
                    class="button-secondary whitespace-nowrap"
                    href={`/patients/${patient.id}`}
                  >
                    View / edit
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination {...props} />
    </div>
  );
}

function Pagination(props: PatientTableProps) {
  const page = props.page ?? 1;
  const shown = props.patients?.length ?? 0;

  return (
    <nav
      aria-label="Patient result pages"
      class="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="text-slate-600">
        Page {page} · {shown} patient{shown === 1 ? '' : 's'} shown
        {typeof props.total === 'number' ? ` · ${props.total} total` : ''}
      </p>
      <div class="flex gap-2">
        {props.previousCursor ? (
          <PageLink
            cursor={props.previousCursor}
            label="Previous"
            name={props.name}
            page={Math.max(1, page - 1)}
          />
        ) : (
          <span
            aria-disabled="true"
            class="button-secondary cursor-not-allowed opacity-50"
          >
            Previous
          </span>
        )}
        {props.nextCursor ? (
          <PageLink
            cursor={props.nextCursor}
            label="Next"
            name={props.name}
            page={page + 1}
          />
        ) : (
          <span
            aria-disabled="true"
            class="button-secondary cursor-not-allowed opacity-50"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

function PageLink(props: {
  cursor: string;
  label: string;
  name?: string;
  page: number;
}) {
  const params = new URLSearchParams({
    cursor: props.cursor,
    page: String(props.page),
  });
  if (props.name) params.set('name', props.name);

  return (
    <a
      class="button-secondary"
      href={`/patients?${params}`}
      hx-get={`/patients/results?${params}`}
      hx-target="#patient-results"
      hx-swap="outerHTML"
    >
      {props.label}
    </a>
  );
}
