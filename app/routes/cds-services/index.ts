import { createRoute } from 'honox/factory';
import { hypertensionService } from '../../cds/service-definition';
import type { CdsDiscoveryResponse } from '../../cds/types';

export default createRoute((c) =>
  c.json<CdsDiscoveryResponse>({
    services: [hypertensionService],
  }),
);
