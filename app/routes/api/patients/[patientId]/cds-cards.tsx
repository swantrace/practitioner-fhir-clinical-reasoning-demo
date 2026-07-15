import { createRoute } from 'honox/factory';
import { buildPatientViewRequest } from '../../../../cds/client/build-patient-view-request';
import { invokeCdsService } from '../../../../cds/client/invoke-service';
import { hypertensionService } from '../../../../cds/service-definition';
import type { CdsCardsResult } from '../../../../cds/types';
import { CdsCards } from '../../../../components/cds-cards';
import { getUiEnv } from '../../../../lib/env';

export const POST = createRoute(async (c) => {
  const patientId = c.req.param('patientId') as string;
  const env = getUiEnv();
  const request = buildPatientViewRequest({
    patientId,
    userId: env.cdsUserId,
    fhirServer: env.fhirBaseUrl,
  });
  const result = await invokeCdsService({
    baseUrl: env.cdsServiceBaseUrl ?? new URL(c.req.url).origin,
    serviceId: hypertensionService.id,
    request,
  });
  const viewResult: CdsCardsResult = result.ok
    ? { ok: true, data: result.data.cards }
    : { ok: false, message: result.message };

  return c.html(<CdsCards result={viewResult} />);
});
