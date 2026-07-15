import type { PatientInput } from '../fhir/types';
import { PatientForm } from './patient-form';

type PatientCreatePanelProps = {
  errors?: Record<string, string>;
  values?: Partial<PatientInput>;
  message?: string;
};

export function PatientCreatePanel(props: PatientCreatePanelProps) {
  return (
    <section id="patient-form" class="grid gap-3">
      <div>
        <h2 class="section-title">Create patient</h2>
        <p class="mt-1 text-sm text-slate-600">
          Add a demographic Patient record to the FHIR server.
        </p>
      </div>
      {props.message ? (
        <div class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {props.message}
        </div>
      ) : null}
      <PatientForm
        action="/patients"
        errors={props.errors}
        submitLabel="Create patient"
        values={props.values}
      />
    </section>
  );
}
