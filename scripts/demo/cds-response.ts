import type {
  CdsDiscoveryResponse,
  CdsHooksResponse,
} from '../../app/cds/types';

const indicators = new Set(['info', 'warning', 'critical']);

export function validateDiscovery(
  value: unknown,
  expectedServiceId: string,
): CdsDiscoveryResponse {
  const response = record(value, 'CDS discovery response');
  if (!Array.isArray(response.services)) {
    throw new Error('CDS discovery response must contain a services array.');
  }

  const service = response.services.find(
    (candidate) =>
      isRecord(candidate) && candidate.id === expectedServiceId,
  );
  if (!service) {
    throw new Error(
      `CDS discovery does not advertise service ${expectedServiceId}.`,
    );
  }
  if (service.hook !== 'patient-view') {
    throw new Error(
      `CDS service ${expectedServiceId} must advertise the patient-view hook.`,
    );
  }

  return value as CdsDiscoveryResponse;
}

export function validateCardsResponse(value: unknown): CdsHooksResponse {
  const response = record(value, 'CDS Hooks response');
  if (!Array.isArray(response.cards)) {
    throw new Error('CDS Hooks response must contain a cards array.');
  }

  for (const [index, candidate] of response.cards.entries()) {
    const card = record(candidate, `cards[${index}]`);
    nonEmptyString(card.summary, `cards[${index}].summary`);
    if (typeof card.indicator !== 'string' || !indicators.has(card.indicator)) {
      throw new Error(
        `cards[${index}].indicator must be info, warning, or critical.`,
      );
    }

    const source = record(card.source, `cards[${index}].source`);
    nonEmptyString(source.label, `cards[${index}].source.label`);

    if (card.detail !== undefined) {
      nonEmptyString(card.detail, `cards[${index}].detail`);
    }
    if (card.uuid !== undefined) {
      nonEmptyString(card.uuid, `cards[${index}].uuid`);
    }
  }

  return value as CdsHooksResponse;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be a JSON object.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}
