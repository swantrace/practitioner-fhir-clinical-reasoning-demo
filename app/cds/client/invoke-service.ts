import type { CdsHooksResponse, PatientViewHookRequest } from '../types';

export type CdsServiceResult =
  | { ok: true; data: CdsHooksResponse }
  | { ok: false; message: string; status?: number };

export async function invokeCdsService(input: {
  baseUrl: string;
  serviceId: string;
  request: PatientViewHookRequest;
  fetcher?: typeof fetch;
}): Promise<CdsServiceResult> {
  const fetcher = input.fetcher ?? fetch;

  try {
    const url = new URL(
      `cds-services/${encodeURIComponent(input.serviceId)}`,
      ensureSlash(input.baseUrl),
    );
    const response = await fetcher(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(input.request),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `CDS service returned status ${response.status}.`,
      };
    }

    const body = (await response.json()) as Partial<CdsHooksResponse>;
    if (!Array.isArray(body.cards)) {
      return {
        ok: false,
        message: 'CDS service returned an invalid response.',
      };
    }

    return { ok: true, data: { cards: body.cards } };
  } catch {
    return { ok: false, message: 'CDS service is not reachable.' };
  }
}

function ensureSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}
