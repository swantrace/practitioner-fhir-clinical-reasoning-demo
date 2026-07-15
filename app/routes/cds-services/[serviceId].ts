import { createRoute } from 'honox/factory';
import {
  evaluateHypertensionService,
  parsePatientViewRequest,
} from '../../cds/service/hypertension';
import { hypertensionService } from '../../cds/service-definition';

export const POST = createRoute(async (c) => {
  if (c.req.param('serviceId') !== hypertensionService.id) {
    return c.json({ error: 'CDS service not found.' }, 404);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const request = parsePatientViewRequest(body);
  if (!request) {
    return c.json(
      { error: 'A valid patient-view CDS Hooks request is required.' },
      400,
    );
  }

  const result = await evaluateHypertensionService(request);
  return result.ok
    ? c.json(result.data)
    : c.json({ error: result.message }, 502);
});
