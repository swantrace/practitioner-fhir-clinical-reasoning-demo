import {
  artifactPath,
  datasetTag,
  fhirRequest,
  readJson,
  resourceLabel,
} from './fhir-client';

type Bundle = {
  resourceType: 'Bundle';
  entry?: Array<{ resource?: { resourceType?: string; id?: string } }>;
};

const tag = encodeURIComponent(`${datasetTag.system}|${datasetTag.code}`);
const bundle = await readJson<Bundle>(artifactPath('fixtures/demo-data-bundle.json'));
const patientIds = new Set(
  bundle.entry
    ?.map((entry) => entry.resource)
    .filter((resource) => resource?.resourceType === 'Patient')
    .map((resource) => resource?.id)
    .filter((id): id is string => Boolean(id)) ?? [],
);

// HAPI search indexing can briefly lag behind a just-created Observation. Query
// both the dataset tag and each fixture Patient compartment over several short
// passes so an immediate reset remains deterministic.
for (let pass = 0; pass < 8; pass += 1) {
  for (const resourceType of ['Observation', 'Condition']) {
    const searches = [
      `${resourceType}?_tag=${tag}&_count=200&_elements=id`,
      ...[...patientIds].map(
        (patientId) =>
          `${resourceType}?patient=${encodeURIComponent(patientId)}&_count=200&_elements=id`,
      ),
    ];
    const resources = new Map<string, { resourceType?: string; id?: string }>();

    for (const search of searches) {
      const matches = await fhirRequest<Bundle>(search);
      for (const entry of matches.entry ?? []) {
        const resource = entry.resource;
        if (resource?.id) resources.set(resource.id, resource);
      }
    }

    for (const resource of resources.values()) {
      await fhirRequest(`${resourceType}/${encodeURIComponent(resource.id!)}`, {
        method: 'DELETE',
      });
      console.log(`Deleted ${resourceLabel(resource)}`);
    }
  }

  if (pass < 7) await delay(400);
}

// Fixed fixture Patients are overwritten by the transaction. Only remove tagged
// Patients that no longer belong to the current fixture version.
const taggedPatients = await fhirRequest<Bundle>(
  `Patient?_tag=${tag}&_count=200&_elements=id`,
);
for (const entry of taggedPatients.entry ?? []) {
  const resource = entry.resource;
  if (!resource?.id || patientIds.has(resource.id)) continue;
  await fhirRequest(`Patient/${encodeURIComponent(resource.id)}`, {
    method: 'DELETE',
  });
  console.log(`Deleted ${resourceLabel(resource)}`);
}

const result = await fhirRequest<Bundle>('', {
  method: 'POST',
  body: JSON.stringify(bundle),
});

const count = result.entry?.length ?? 0;
if (count !== bundle.entry?.length) {
  throw new Error(
    `Reset transaction returned ${count} entries; expected ${bundle.entry?.length ?? 0}.`,
  );
}

console.log(`Reset complete: ${count} deterministic demo resources installed.`);

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
