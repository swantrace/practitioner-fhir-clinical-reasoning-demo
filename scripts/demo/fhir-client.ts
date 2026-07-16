import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);
export const datasetTag = {
  system: 'https://example.org/fhir/demo-dataset',
  code: 'hypertension-cds-v1',
};

type FhirResource = {
  resourceType?: string;
  id?: string;
  issue?: Array<{ diagnostics?: string; details?: { text?: string } }>;
  entry?: Array<{ resource?: FhirResource }>;
  [key: string]: unknown;
};

export function artifactPath(relativePath: string) {
  return resolve(root, relativePath);
}

export async function readJson<T = FhirResource>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export async function fhirRequest<T = FhirResource>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.FHIR_BASE_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error(
      'FHIR_BASE_URL is required. Start `bun run dev:hapi-proxy` and set FHIR_BASE_URL=http://localhost:18080/fhir.',
    );
  }

  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/fhir+json');
  if (init.body) headers.set('Content-Type', 'application/fhir+json');
  if (process.env.FHIR_BEARER_TOKEN) {
    headers.set('Authorization', `Bearer ${process.env.FHIR_BEARER_TOKEN}`);
  }

  const response = await fetch(path ? `${baseUrl}/${path}` : baseUrl, {
    ...init,
    headers,
  });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as T) : ({} as T);
  const outcome = body as FhirResource;

  if (!response.ok) {
    const diagnostics = outcome.issue
      ?.map((issue) => issue.diagnostics ?? issue.details?.text)
      .filter(Boolean)
      .join('; ');
    throw new Error(
      `${init.method ?? 'GET'} ${path || '/'} failed (${response.status})${diagnostics ? `: ${diagnostics}` : ''}`,
    );
  }

  return body;
}

export function resourceLabel(resource: FhirResource) {
  return `${resource.resourceType}/${resource.id}`;
}
