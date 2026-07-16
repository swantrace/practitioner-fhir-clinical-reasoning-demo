import { createRoute } from 'honox/factory';
import { waitUntilHypertensionPlanNotApplicable } from '../../../../clinical-reasoning/hapi';
import {
  BloodPressureForm,
  BloodPressureRecorded,
} from '../../../../components/blood-pressure-form';
import { ErrorState } from '../../../../components/errors';
import {
  createBloodPressureObservation,
  waitForObservationSearchIndex,
} from '../../../../fhir/observation';
import { getPatient } from '../../../../fhir/patient';
import { validateBloodPressureForm } from '../../../../validation/blood-pressure';

export const GET = createRoute((c) => {
  const patientId = c.req.param('patientId') as string;
  return c.html(<BloodPressureForm patientId={patientId} />);
});

export const POST = createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const validation = validateBloodPressureForm(await c.req.formData());

  if (!validation.ok) {
    return c.html(
      <BloodPressureForm
        errors={validation.errors}
        patientId={patientId}
        values={validation.values}
      />,
    );
  }

  const patient = await getPatient(patientId);
  if (!patient.ok) {
    return c.html(<ErrorState message={patient.message} />);
  }

  const result = await createBloodPressureObservation(
    patientId,
    validation.data,
  );
  if (!result.ok) {
    return c.html(<ErrorState message={result.message} />);
  }

  const searchable = await waitForObservationSearchIndex(
    patientId,
    result.data.id,
  );
  if (!searchable) {
    return c.html(
      <ErrorState message="Blood pressure was recorded, but HAPI has not made it available to clinical reasoning yet. Refresh the patient chart to retry." />,
    );
  }

  const clinicalReasoningUpdated =
    await waitUntilHypertensionPlanNotApplicable(patientId);
  if (!clinicalReasoningUpdated) {
    return c.html(
      <ErrorState message="Blood pressure was recorded, but clinical reasoning has not incorporated it yet. Refresh the patient chart to retry." />,
    );
  }

  c.header('HX-Trigger', 'blood-pressure-recorded');
  return c.html(<BloodPressureRecorded observation={result.data} />);
});
