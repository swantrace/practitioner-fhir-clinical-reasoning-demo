import { getUiEnv } from '../lib/env';
import type { FhirResult } from './types';

type FhirRequestOptions = {
  method?: string;
  body?: unknown;
};

type BundleRequester = (path: string) => Promise<FhirResult<fhir4.Bundle>>;

type SearchAllOptions = {
  baseUrl?: string;
  maxPages?: number;
  request?: BundleRequester;
};

export async function fhirRequest<T>(
  path: string,
  options: FhirRequestOptions = {},
): Promise<FhirResult<T>> {
  try {
    const env = getUiEnv();
    const url = buildFhirUrl(env.fhirBaseUrl, path);

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

export function buildFhirUrl(baseUrl: string, path: string) {
  const base = new URL(ensureSlash(baseUrl));

  if (path.startsWith('?')) {
    base.pathname = base.pathname.replace(/\/$/, '');
    base.search = path;
    return base;
  }

  return new URL(path.replace(/^\/+/, ''), base);
}

export async function searchAllFhirResources<T extends fhir4.Resource>(
  initialPath: string,
  resourceType: T['resourceType'],
  options: SearchAllOptions = {},
): Promise<FhirResult<T[]>> {
  const baseUrl = options.baseUrl ?? getUiEnv().fhirBaseUrl;
  const maxPages = options.maxPages ?? 100;
  const request =
    options.request ?? ((path: string) => fhirRequest<fhir4.Bundle>(path));
  const resources: T[] = [];
  const visited = new Set<string>();
  let path: string | undefined = initialPath;

  for (let page = 0; path && page < maxPages; page += 1) {
    if (visited.has(path)) {
      return paginationError('FHIR search pagination contains a loop.');
    }
    visited.add(path);

    const result = await request(path);
    if (!result.ok) return result;

    resources.push(...bundleEntries<T>(result.data, resourceType));
    const nextLink = result.data.link?.find(
      (link) => link.relation === 'next',
    )?.url;
    if (!nextLink) return { ok: true, data: resources };

    path = fhirContinuationPath(baseUrl, nextLink);
    if (!path) {
      return paginationError(
        'FHIR search returned an invalid continuation link.',
      );
    }
  }

  return paginationError(
    `FHIR search exceeded the ${maxPages}-page safety limit.`,
  );
}

export function fhirContinuationPath(baseUrl: string, link: string) {
  try {
    const base = new URL(ensureSlash(baseUrl));
    const continuation = new URL(link, base);
    if (continuation.origin !== base.origin) return undefined;

    const basePath = base.pathname.replace(/\/$/, '');
    const continuationPath = continuation.pathname.replace(/\/$/, '');
    if (continuationPath === basePath) return continuation.search || undefined;

    const prefix = `${basePath}/`;
    if (!continuation.pathname.startsWith(prefix)) return undefined;

    const relativePath = continuation.pathname.slice(prefix.length);
    return relativePath ? `${relativePath}${continuation.search}` : undefined;
  } catch {
    return undefined;
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

function paginationError(message: string): FhirResult<never> {
  return { ok: false, status: 502, message };
}
