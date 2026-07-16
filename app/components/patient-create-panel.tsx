import type { PatientInput } from '../fhir/types';
import { PatientForm } from './patient-form';

type PatientCreatePanelProps = {
  errors?: Record<string, string>;
  values?: Partial<PatientInput>;
  error?: string;
};

export function PatientCreateDialog() {
  return (
    <dialog
      aria-describedby="patient-create-description"
      aria-labelledby="patient-create-title"
      class="patient-dialog m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-0 shadow-2xl"
      id="patient-create-dialog"
    >
      <PatientCreatePanel />
    </dialog>
  );
}

export function PatientCreatePanel(props: PatientCreatePanelProps) {
  return (
    <section class="grid gap-4 p-5 sm:p-6" id="patient-create-content">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold" id="patient-create-title">
            Create patient
          </h2>
          <p
            class="mt-1 text-sm text-slate-600"
            id="patient-create-description"
          >
            Add a demographic Patient record to the FHIR server.
          </p>
        </div>
        <button
          aria-label="Close create patient dialog"
          class="rounded-md px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          data-close-patient-dialog
          type="button"
        >
          ×
        </button>
      </div>
      {props.error ? (
        <div
          class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          data-form-error
          role="alert"
          tabindex={-1}
        >
          {props.error}
        </div>
      ) : null}
      <PatientForm
        action="/patients"
        errors={props.errors}
        formId="patient-create-form"
        showCancel
        submitLabel="Create patient"
        target="#patient-create-content"
        values={props.values}
      />
    </section>
  );
}
