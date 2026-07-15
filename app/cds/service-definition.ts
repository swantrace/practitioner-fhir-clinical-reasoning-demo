import type { CdsServiceDefinition } from './types';

export const hypertensionService: CdsServiceDefinition = {
  hook: 'patient-view',
  id: 'hypertension-bp-followup',
  title: 'Hypertension Blood Pressure Follow-up',
  description:
    'Identifies missing blood-pressure documentation for patients with active hypertension.',
};
