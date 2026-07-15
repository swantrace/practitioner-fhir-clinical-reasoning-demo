import { createRoute } from 'honox/factory';
import { fhirRequest } from '../../../fhir/client';

export default createRoute(async (c) => {
  const result = await fhirRequest<fhir4.CapabilityStatement>('metadata');

  if (!result.ok) {
    return c.json(
      {
        error: result.message,
        upstreamStatus: result.status,
      },
      502,
    );
  }

  return c.json(result.data);
});
