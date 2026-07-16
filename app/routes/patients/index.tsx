import { createRoute } from 'honox/factory';
import { PatientCreatePanel } from '../../components/patient-create-panel';
import { PatientSearch } from '../../components/patient-search';
import { PatientResultsSkeleton } from '../../components/patient-skeleton';
import { createPatient } from '../../fhir/patient';
import { validatePatientForm } from '../../validation/patient';

export const POST = createRoute(async (c) => {
  const validation = await validatePatientForm(await c.req.formData());

  if (!validation.ok) {
    return c.html(
      <PatientCreatePanel
        errors={validation.errors}
        values={validation.values}
      />,
    );
  }

  const result = await createPatient(validation.data);
  if (!result.ok) {
    return c.html(
      <PatientCreatePanel
        errors={{ firstName: result.message }}
        values={validation.data}
      />,
    );
  }

  return c.html(
    <PatientCreatePanel message="Patient created. Refresh or search to view the updated list." />,
  );
});

export default createRoute(async (c) => {
  const query = c.req.query('name')?.trim();
  const cursor = c.req.query('cursor');
  const page = positiveInteger(c.req.query('page'));

  return c.render(
    <main class="page-shell grid gap-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold tracking-normal">
            Patient Management
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            Search, create, edit, and manage Patient resources.
          </p>
        </div>
      </div>
      <section class="grid gap-3">
        <h2 class="section-title">Find patients</h2>
        <PatientSearch query={query} />
        <PatientResultsSkeleton cursor={cursor} page={page} query={query} />
      </section>
      <PatientCreatePanel />
    </main>,
    { title: 'Patients' },
  );
});

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
