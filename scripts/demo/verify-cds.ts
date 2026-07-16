import type {
  CdsDiscoveryResponse,
  CdsHooksResponse,
  PatientViewHookRequest,
} from '../../app/cds/types';
import { validateCardsResponse, validateDiscovery } from './cds-response';

const serviceId = 'hypertension-bp-followup';
const cdsBaseUrl = requiredBaseUrl();

const scenarios = [
  {
    patientId: 'hypertension-missing-bp',
    hookInstance: '11111111-1111-4111-8111-111111111111',
    expectedCards: 1,
    reason: 'active hypertension and no blood-pressure observation',
  },
  {
    patientId: 'hypertension-with-bp',
    hookInstance: '22222222-2222-4222-8222-222222222222',
    expectedCards: 0,
    reason: 'active hypertension with a documented blood-pressure observation',
  },
  {
    patientId: 'no-hypertension',
    hookInstance: '33333333-3333-4333-8333-333333333333',
    expectedCards: 0,
    reason: 'no active hypertension condition',
  },
] as const;

const discovery = await cdsRequest<CdsDiscoveryResponse>('cds-services');
validateDiscovery(discovery, serviceId);
console.log(`PASS discovery: ${serviceId} advertises patient-view`);

for (const scenario of scenarios) {
  const request: PatientViewHookRequest = {
    hook: 'patient-view',
    hookInstance: scenario.hookInstance,
    context: {
      patientId: scenario.patientId,
      userId: process.env.CDS_USER_ID ?? 'Practitioner/demo',
    },
  };
  if (process.env.FHIR_BASE_URL) request.fhirServer = process.env.FHIR_BASE_URL;

  const response = validateCardsResponse(
    await cdsRequest<CdsHooksResponse>(`cds-services/${serviceId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  );

  if (response.cards.length !== scenario.expectedCards) {
    throw new Error(
      `${scenario.patientId}: expected ${scenario.expectedCards} card(s), received ${response.cards.length}.`,
    );
  }

  if (scenario.expectedCards === 1) {
    const card = response.cards[0];
    if (card.indicator !== 'warning') {
      throw new Error(
        `${scenario.patientId}: expected a warning card, received ${card.indicator}.`,
      );
    }
    if (!card.summary.toLowerCase().includes('blood pressure')) {
      throw new Error(
        `${scenario.patientId}: card summary must identify the blood-pressure issue.`,
      );
    }
    if (!card.detail || !card.source.label) {
      throw new Error(
        `${scenario.patientId}: warning card must include detail and source.label.`,
      );
    }
  }

  console.log(
    `PASS ${scenario.patientId}: cards=${response.cards.length} (${scenario.reason})`,
  );
}

console.log(
  'Verification complete: CDS discovery and all three patient-view responses passed.',
);

function requiredBaseUrl() {
  const value = process.env.CDS_SERVICE_BASE_URL?.replace(/\/$/, '');
  if (!value) {
    throw new Error(
      'CDS_SERVICE_BASE_URL is required. Start the application and set it to the HonoX base URL, for example http://127.0.0.1:5174/.',
    );
  }
  return value;
}

async function cdsRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (process.env.CDS_BEARER_TOKEN) {
    headers.set('Authorization', `Bearer ${process.env.CDS_BEARER_TOKEN}`);
  }

  const response = await fetch(`${cdsBaseUrl}/${path}`, { ...init, headers });
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `${init.method ?? 'GET'} /${path} returned non-JSON with status ${response.status}.`,
    );
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? `: ${body.error}`
        : '';
    throw new Error(
      `${init.method ?? 'GET'} /${path} failed (${response.status})${message}`,
    );
  }

  return body as T;
}
