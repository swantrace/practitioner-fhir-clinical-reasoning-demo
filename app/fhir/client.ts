import { getUiEnv } from '../lib/env';
import type { FhirResult } from './types';

type FhirRequestOptions = {
  method?: string;
  body?: unknown;
};

export async function fhirRequest<T>(
  path: string,
  options: FhirRequestOptions = {},
): Promise<FhirResult<T>> {
  try {
    const env = getUiEnv();
    const url = new URL(path.replace(/^\/+/, ''), ensureSlash(env.fhirBaseUrl));

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      cache: 'no-store',
      headers: {
        accept: 'application/fhir+json',
        ...(env.fhirBearerToken
          ? { authorization: `Bearer ${env.fhirBearerToken}` }
          : {}),
        ...(options.body ? { 'content-type': 'application/fhir+json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `FHIR request failed with status ${response.status}.`,
      };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      message:
        'FHIR service is not reachable. Check local environment settings.',
    };
  }
}

export function bundleEntries<T extends fhir4.Resource>(
  bundle: fhir4.Bundle | undefined,
  resourceType: T['resourceType'],
): T[] {
  return (
    bundle?.entry
      ?.map((entry) => entry.resource)
      .filter(
        (resource): resource is T => resource?.resourceType === resourceType,
      ) ?? []
  );
}

function ensureSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}
