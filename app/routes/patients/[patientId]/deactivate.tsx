import { createRoute } from 'honox/factory';
import { Demographics } from '../../../components/chart-demographics';
import { ErrorState } from '../../../components/errors';
import { deactivatePatient, getPatient } from '../../../fhir/patient';

export const POST = createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const patient = await getPatient(patientId);
  if (!patient.ok) return c.html(<ErrorState message={patient.message} />);

  const result = await deactivatePatient(patient.data);
  return c.html(
    result.ok ? (
      <Demographics patient={result.data} />
    ) : (
      <ErrorState message={result.message} />
    ),
  );
});
