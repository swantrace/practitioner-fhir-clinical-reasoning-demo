import { patientName } from '../fhir/format';
import { EmptyState, ErrorState } from './errors';

type PatientTableProps = {
  patients?: fhir4.Patient[];
  error?: string;
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
      <table class="min-w-full divide-y divide-slate-200 text-sm">
        <thead class="bg-slate-100 text-left text-xs font-semibold uppercase text-slate-600">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Gender</th>
            <th class="px-4 py-3">Date of birth</th>
            <th class="px-4 py-3">Patient ID</th>
            <th class="px-4 py-3">Status</th>
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
              <td class="px-4 py-3 font-mono text-xs">{patient.id}</td>
              <td class="px-4 py-3">
                {patient.active === false ? 'Inactive' : 'Active'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
