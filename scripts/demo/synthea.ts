import { readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { artifactPath, readJson } from './fhir-client';

export const syntheaTag = {
  system: 'https://example.org/fhir/demo-dataset',
  code: 'synthea-12-v1',
};

export type TransactionBundle = {
  resourceType: 'Bundle';
  type: 'transaction';
  entry: TransactionEntry[];
};

export type TransactionEntry = {
  fullUrl?: string;
  resource: {
    resourceType: string;
    id: string;
    meta?: {
      tag?: Array<{ system?: string; code?: string }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  request: { method: string; url: string };
};

export async function syntheaFixturePaths() {
  const directory = artifactPath('fixtures/synthea');
  const names = (await readdir(directory))
    .filter((name) => name.endsWith('.json'))
    .sort();
  return names.map((name) => resolve(directory, name));
}

export async function readSyntheaBundle(path: string) {
  const bundle = await readJson<TransactionBundle>(path);
  validateSyntheaBundle(bundle, basename(path));
  return bundle;
}

export function prepareSyntheaBundle(bundle: TransactionBundle) {
  for (const entry of bundle.entry) {
    const { resource } = entry;
    const tags = resource.meta?.tag ?? [];
    if (
      !tags.some(
        (tag) =>
          tag.system === syntheaTag.system && tag.code === syntheaTag.code,
      )
    ) {
      tags.push(syntheaTag);
    }
    resource.meta = { ...resource.meta, tag: tags };
    entry.request = {
      method: 'PUT',
      url: `${resource.resourceType}/${resource.id}`,
    };
  }

  return bundle;
}

export function patientId(bundle: TransactionBundle) {
  return bundle.entry.find(
    (entry) => entry.resource.resourceType === 'Patient',
  )?.resource.id;
}

export function conditionalReferences(bundle: TransactionBundle) {
  return new Set(
    bundle.entry.flatMap((entry) => externalReferences(entry.resource)),
  );
}

export function buildDependencyBundle(references: Iterable<string>) {
  const resources = [...new Set(references)]
    .sort()
    .map(dependencyResource);

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: resources.map((resource) => ({
      fullUrl: `${resource.resourceType}/${resource.id}`,
      resource,
      request: {
        method: 'PUT',
        url: `${resource.resourceType}/${resource.id}`,
      },
    })),
  } satisfies TransactionBundle;
}

function validateSyntheaBundle(
  bundle: TransactionBundle,
  filename: string,
) {
  if (bundle.resourceType !== 'Bundle' || bundle.type !== 'transaction') {
    throw new Error(`${filename} must be a FHIR transaction Bundle.`);
  }
  if (!Array.isArray(bundle.entry) || !bundle.entry.length) {
    throw new Error(`${filename} must contain transaction entries.`);
  }

  const patients = bundle.entry.filter(
    (entry) => entry.resource?.resourceType === 'Patient',
  );
  if (patients.length !== 1) {
    throw new Error(`${filename} must contain exactly one Patient.`);
  }

  const fullUrls = new Set<string>();
  const resourceKeys = new Set<string>();

  for (const [index, entry] of bundle.entry.entries()) {
    if (!entry.fullUrl?.startsWith('urn:uuid:')) {
      throw new Error(`${filename} entry ${index} must have a URN fullUrl.`);
    }
    if (!entry.resource?.resourceType || !entry.resource.id) {
      throw new Error(
        `${filename} entry ${index} must have resourceType and id.`,
      );
    }
    if (!entry.request?.method || !entry.request.url) {
      throw new Error(`${filename} entry ${index} must have a request.`);
    }

    const resourceKey = `${entry.resource.resourceType}/${entry.resource.id}`;
    if (fullUrls.has(entry.fullUrl)) {
      throw new Error(`${filename} contains duplicate fullUrl ${entry.fullUrl}.`);
    }
    if (resourceKeys.has(resourceKey)) {
      throw new Error(`${filename} contains duplicate resource ${resourceKey}.`);
    }
    fullUrls.add(entry.fullUrl);
    resourceKeys.add(resourceKey);
  }

  for (const entry of bundle.entry) {
    for (const reference of urnReferences(entry.resource)) {
      if (!fullUrls.has(reference)) {
        throw new Error(`${filename} contains unresolved reference ${reference}.`);
      }
    }
  }
}

function urnReferences(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(urnReferences);
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  return [
    ...(typeof record.reference === 'string' &&
    record.reference.startsWith('urn:uuid:')
      ? [record.reference]
      : []),
    ...Object.values(record).flatMap(urnReferences),
  ];
}

function externalReferences(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(externalReferences);
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  return [
    ...(typeof record.reference === 'string' &&
    /^(Practitioner|Organization|Location)\?identifier=/.test(record.reference)
      ? [record.reference]
      : []),
    ...Object.values(record).flatMap(externalReferences),
  ];
}

function dependencyResource(reference: string): TransactionEntry['resource'] {
  const match = reference.match(
    /^(Practitioner|Organization|Location)\?identifier=([^|]+)\|(.+)$/,
  );
  if (!match) throw new Error(`Unsupported Synthea reference ${reference}.`);

  const [, resourceType, system, value] = match;
  const id = `synthea-${resourceType.toLowerCase()}-${value}`;
  const base = {
    resourceType,
    id,
    meta: { tag: [syntheaTag] },
    identifier: [{ system, value }],
  };

  if (resourceType === 'Practitioner') {
    return {
      ...base,
      active: true,
      name: [{ text: `Synthea Practitioner ${value}` }],
    };
  }
  if (resourceType === 'Organization') {
    return { ...base, active: true, name: `Synthea Organization ${value}` };
  }
  return { ...base, status: 'active', name: `Synthea Location ${value}` };
}
