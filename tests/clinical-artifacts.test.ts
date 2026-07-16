import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { describe, test } from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = resolve(
  root,
  'clinical-artifacts/hypertension-bp-followup',
);

describe('hypertension clinical artifacts', () => {
  test('FHIR Library packages the checked-in CQL and JSON ELM exactly', async () => {
    const [library, cql, elm] = await Promise.all([
      readFile(
        resolve(artifactRoot, 'fhir/Library-HypertensionBpFollowup.json'),
        'utf8',
      ).then(JSON.parse),
      readFile(
        resolve(artifactRoot, 'cql/HypertensionBpFollowup.cql'),
        'utf8',
      ),
      readFile(
        resolve(artifactRoot, 'elm/HypertensionBpFollowup.json'),
        'utf8',
      ),
    ]);

    const byType = new Map<string, string>(
      library.content.map((content: { contentType: string; data: string }) => [
        content.contentType,
        content.data,
      ]),
    );
    assert.equal(
      Buffer.from(byType.get('text/cql') ?? '', 'base64').toString('utf8'),
      cql,
    );
    assert.equal(
      Buffer.from(byType.get('application/elm+json') ?? '', 'base64').toString(
        'utf8',
      ),
      elm,
    );
  });

  test('PlanDefinition references the versioned Library and CQL identifier', async () => {
    const plan = JSON.parse(
      await readFile(
        resolve(
          artifactRoot,
          'fhir/PlanDefinition-hypertension-bp-followup.json',
        ),
        'utf8',
      ),
    );

    assert.deepEqual(plan.library, [
      'https://example.org/fhir/Library/HypertensionBpFollowup|1.0.0',
    ]);
    assert.equal(
      plan.action[0].condition[0].expression.expression,
      'BloodPressureDocumentationMissing',
    );
  });

  test('fixture defines the three deterministic patient scenarios', async () => {
    const bundle = JSON.parse(
      await readFile(resolve(root, 'fixtures/demo-data-bundle.json'), 'utf8'),
    );
    const patientIds = bundle.entry
      .map((entry: { resource: { resourceType: string; id: string } }) =>
        entry.resource.resourceType === 'Patient' ? entry.resource.id : null,
      )
      .filter(Boolean)
      .sort();

    assert.deepEqual(patientIds, [
      'hypertension-missing-bp',
      'hypertension-with-bp',
      'no-hypertension',
    ]);
  });
});
