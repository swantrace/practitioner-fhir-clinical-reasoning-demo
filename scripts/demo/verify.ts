import { hasApplicableAction } from '../../app/clinical-reasoning/hapi';
import { fhirRequest } from './fhir-client';

const planDefinitionId = 'hypertension-bp-followup';

const scenarios = [
  {
    patientId: 'hypertension-missing-bp',
    expected: true,
    reason: 'active hypertension and no blood-pressure observation',
  },
  {
    patientId: 'hypertension-with-bp',
    expected: false,
    reason: 'active hypertension with a documented blood-pressure observation',
  },
  {
    patientId: 'no-hypertension',
    expected: false,
    reason: 'no active hypertension condition',
  },
] as const;

const library = await fhirRequest<{ content?: Array<{ contentType?: string }> }>(
  'Library/hypertension-bp-logic',
);
const contentTypes = new Set(
  library.content?.map((content) => content.contentType) ?? [],
);
for (const requiredType of ['text/cql', 'application/elm+json']) {
  if (!contentTypes.has(requiredType)) {
    throw new Error(`Installed Library is missing ${requiredType} content.`);
  }
}

await fhirRequest(`PlanDefinition/${planDefinitionId}`);

for (const scenario of scenarios) {
  await fhirRequest(`Patient/${scenario.patientId}`);
  const query = new URLSearchParams({
    subject: `Patient/${scenario.patientId}`,
    useServerData: 'true',
  });
  const result = await fhirRequest(
    `PlanDefinition/${planDefinitionId}/$apply?${query}`,
  );
  const actual = hasApplicableAction(result);

  if (actual !== scenario.expected) {
    throw new Error(
      `${scenario.patientId}: expected applicable=${scenario.expected}, received ${actual}.`,
    );
  }

  console.log(
    `PASS ${scenario.patientId}: applicable=${actual} (${scenario.reason})`,
  );
}

console.log('Verification complete: all three HAPI $apply scenarios passed.');
