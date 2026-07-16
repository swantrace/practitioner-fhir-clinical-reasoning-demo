import { createRoute } from 'honox/factory';
import { CdsCardsPanel } from '../../components/cds-cards';
import { Demographics } from '../../components/chart-demographics';
import {
  Conditions,
  Medications,
  VitalSigns,
} from '../../components/chart-sections';
import { ClinicalSummary } from '../../components/chart-summary';
import { ErrorState } from '../../components/errors';
import { getPatientChart } from '../../fhir/chart';
import { updatePatient } from '../../fhir/patient';
import { validatePatientForm } from '../../validation/patient';

export const PATCH = createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const validation = await validatePatientForm(await c.req.formData());

  if (!validation.ok) {
    const chart = await getPatientChart(patientId);
    return c.html(
      chart.ok ? (
        <Demographics errors={validation.errors} patient={chart.data.patient} />
      ) : (
        <ErrorState message={chart.message} />
      ),
    );
  }

  const result = await updatePatient(patientId, validation.data);
  return c.html(
    result.ok ? (
      <Demographics patient={result.data} />
    ) : (
      <ErrorState message={result.message} />
    ),
  );
});

export default createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const chart = await getPatientChart(patientId);

  if (!chart.ok) {
    return c.render(
      <main class="page-shell">
        <ErrorState message={chart.message} />
      </main>,
    );
  }

  return c.render(
    <main class="page-shell grid gap-5">
      <a class="text-sm font-medium" href="/patients">
        Back to patients
      </a>
      <Demographics patient={chart.data.patient} />
      <ClinicalSummary
        conditions={chart.data.conditions}
        patient={chart.data.patient}
        vitalSigns={chart.data.vitalSigns}
      />
      <CdsCardsPanel patientId={patientId} />
      <VitalSigns observations={chart.data.vitalSigns} patientId={patientId} />
      <Conditions conditions={chart.data.conditions} />
      <Medications medications={chart.data.medications} />
    </main>,
  );
});
