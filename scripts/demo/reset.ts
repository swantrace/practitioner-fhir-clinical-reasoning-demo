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

// Delete children before patients so this also works when referential integrity is enabled.
for (const resourceType of ['Observation', 'Condition', 'Patient']) {
  const matches = await fhirRequest<Bundle>(
    `${resourceType}?_tag=${tag}&_count=200&_elements=id`,
  );

  for (const entry of matches.entry ?? []) {
    const resource = entry.resource;
    if (!resource?.id) continue;
    await fhirRequest(`${resourceType}/${encodeURIComponent(resource.id)}`, {
      method: 'DELETE',
    });
    console.log(`Deleted ${resourceLabel(resource)}`);
  }
}

const bundle = await readJson<Bundle>(artifactPath('fixtures/demo-data-bundle.json'));
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
