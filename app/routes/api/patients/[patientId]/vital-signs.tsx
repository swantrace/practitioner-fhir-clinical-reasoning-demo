import { createRoute } from 'honox/factory';
import { VitalSigns } from '../../../../components/chart-sections';
import { ErrorState } from '../../../../components/errors';
import { getPatientChart } from '../../../../fhir/chart';

export const GET = createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const chart = await getPatientChart(patientId);

  return c.html(
    chart.ok ? (
      <VitalSigns observations={chart.data.vitalSigns} patientId={patientId} />
    ) : (
      <ErrorState message={chart.message} />
    ),
  );
});
