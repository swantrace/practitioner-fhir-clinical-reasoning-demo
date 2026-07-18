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

    const patientGenders = Object.fromEntries(
      bundle.entry
        .map((entry: { resource: fhir4.Resource }) => entry.resource)
        .filter(
          (resource: fhir4.Resource): resource is fhir4.Patient =>
            resource.resourceType === 'Patient',
        )
        .map((patient: fhir4.Patient) => [patient.id, patient.gender]),
    );
    assert.deepEqual(patientGenders, {
      'hypertension-missing-bp': 'male',
      'hypertension-with-bp': 'female',
      'no-hypertension': 'other',
    });
  });

  test('fixture enriches every scenario without changing CDS applicability', async () => {
    const bundle = JSON.parse(
      await readFile(resolve(root, 'fixtures/demo-data-bundle.json'), 'utf8'),
    );
    const resources: fhir4.Resource[] = bundle.entry.map(
      (entry: { resource: fhir4.Resource }) => entry.resource,
    );
    const observations: fhir4.Observation[] = resources.filter(
      (resource: fhir4.Resource): resource is fhir4.Observation =>
        resource.resourceType === 'Observation',
    );
    const conditions: fhir4.Condition[] = resources.filter(
      (resource: fhir4.Resource): resource is fhir4.Condition =>
        resource.resourceType === 'Condition',
    );
    const observationsFor = (patientId: string) =>
      observations.filter(
        (observation: fhir4.Observation) =>
          observation.subject?.reference === `Patient/${patientId}`,
      );
    const conditionCodesFor = (patientId: string) =>
      conditions
        .filter(
          (condition: fhir4.Condition) =>
            condition.subject?.reference === `Patient/${patientId}`,
        )
        .flatMap((condition: fhir4.Condition) =>
          condition.code?.coding?.map((coding) => coding.code),
        );
    const hasLoinc = (observation: fhir4.Observation, code: string) =>
      observation.code.coding?.some(
        (coding) =>
          coding.system === 'http://loinc.org' && coding.code === code,
      );

    const alexVitals = observationsFor('hypertension-missing-bp');
    const jordanVitals = observationsFor('hypertension-with-bp');
    const taylorVitals = observationsFor('no-hypertension');

    assert.equal(alexVitals.some((item) => hasLoinc(item, '85354-9')), false);
    assert.equal(jordanVitals.some((item) => hasLoinc(item, '85354-9')), true);
    assert.equal(taylorVitals.some((item) => hasLoinc(item, '85354-9')), false);

    assert.deepEqual(conditionCodesFor('hypertension-missing-bp').sort(), [
      '38341003',
      '55822004',
    ]);
    assert.deepEqual(conditionCodesFor('hypertension-with-bp').sort(), [
      '38341003',
      '44054006',
    ]);
    assert.deepEqual(conditionCodesFor('no-hypertension'), ['195967001']);

    assert.equal(alexVitals.filter((item) => hasLoinc(item, '8867-4')).length, 2);
    assert.equal(alexVitals.filter((item) => hasLoinc(item, '29463-7')).length, 2);
    assert.equal(jordanVitals.filter((item) => hasLoinc(item, '85354-9')).length, 2);
    assert.equal(jordanVitals.filter((item) => hasLoinc(item, '8867-4')).length, 2);
    assert.equal(taylorVitals.filter((item) => hasLoinc(item, '8867-4')).length, 2);
    assert.equal(taylorVitals.filter((item) => hasLoinc(item, '2708-6')).length, 2);
  });
});
