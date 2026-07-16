import {
  artifactPath,
  fhirRequest,
  readJson,
  resourceLabel,
} from './fhir-client';

const artifactPaths = [
  artifactPath(
    'clinical-artifacts/hypertension-bp-followup/fhir/Library-HypertensionBpFollowup.json',
  ),
  artifactPath(
    'clinical-artifacts/hypertension-bp-followup/fhir/PlanDefinition-hypertension-bp-followup.json',
  ),
];

for (const path of artifactPaths) {
  const resource = await readJson<{ resourceType: string; id: string }>(path);
  const installed = await fhirRequest<{ resourceType: string; id: string }>(
    `${resource.resourceType}/${resource.id}`,
    { method: 'PUT', body: JSON.stringify(resource) },
  );
  console.log(`Installed ${resourceLabel(installed)}`);
}
