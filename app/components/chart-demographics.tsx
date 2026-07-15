import { Patient } from 'fhir/r4';
import { patientAge, patientName } from '../fhir/format';
import type { PatientInput } from '../fhir/types';
import { PatientForm } from './patient-form';

export function Demographics(props: {
  patient: Patient;
  errors?: Record<string, string>;
}) {
  const values: Partial<PatientInput> = {
    firstName: props.patient.name?.[0]?.given?.[0],
    lastName: props.patient.name?.[0]?.family,
    gender: props.patient.gender,
    birthDate: props.patient.birthDate,
  };

  return (
    <section
      id="demographics"
      class="grid gap-4 rounded-md border border-slate-200 bg-white p-4"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 class="text-2xl font-semibold">{patientName(props.patient)}</h1>
          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-5">
            <Info label="Gender" value={props.patient.gender ?? 'Unknown'} />
            <Info
              label="Birth date"
              value={props.patient.birthDate ?? 'Unknown'}
            />
            <Info label="Age" value={patientAge(props.patient)} />
            <Info label="Patient ID" value={props.patient.id ?? 'Unknown'} />
            <Info
              label="Status"
              value={props.patient.active === false ? 'Inactive' : 'Active'}
            />
          </dl>
        </div>
        <form
          hx-post={`/patients/${props.patient.id}/deactivate`}
          hx-target="#demographics"
          hx-swap="outerHTML"
          method="post"
        >
          <button class="button-secondary" type="submit">
            Deactivate
          </button>
        </form>
      </div>
      <details>
        <summary class="cursor-pointer text-sm font-medium text-teal-700">
          Edit demographics
        </summary>
        <div class="mt-3 max-w-xl">
          <PatientForm
            action={`/patients/${props.patient.id}`}
            errors={props.errors}
            method="patch"
            submitLabel="Save changes"
            target="#demographics"
            values={values}
          />
        </div>
      </details>
    </section>
  );
}

function Info(props: { label: string; value: string }) {
  return (
    <div>
      <dt class="text-xs font-semibold uppercase text-slate-500">
        {props.label}
      </dt>
      <dd class="mt-1 wrap-break-word text-slate-900">{props.value}</dd>
    </div>
  );
}
