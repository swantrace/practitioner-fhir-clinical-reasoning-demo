export type CdsCardIndicator = 'info' | 'warning' | 'critical';

export type CdsCard = {
  uuid?: string;
  summary: string;
  detail?: string;
  indicator: CdsCardIndicator;
  source: {
    label: string;
    url?: string;
  };
};

export type CdsHooksResponse = {
  cards: CdsCard[];
};

export type PatientViewContext = {
  patientId: string;
  userId: string;
  encounterId?: string;
};

export type PatientViewHookRequest = {
  hook: 'patient-view';
  hookInstance: string;
  fhirServer?: string;
  context: PatientViewContext;
  prefetch?: Record<string, unknown>;
};

export type CdsServiceDefinition = {
  hook: 'patient-view';
  id: string;
  title: string;
  description: string;
};

export type CdsDiscoveryResponse = {
  services: CdsServiceDefinition[];
};

export type CdsCardsResult =
  | { ok: true; data: CdsCard[] }
  | { ok: false; message: string };
