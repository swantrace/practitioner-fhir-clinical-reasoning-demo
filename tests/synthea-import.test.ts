import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildDependencyBundle,
  conditionalReferences,
  patientId,
  prepareSyntheaBundle,
  readSyntheaBundle,
  syntheaFixturePaths,
  syntheaTag,
} from '../scripts/demo/synthea';

describe('Synthea fixture import', () => {
  test('contains 12 unique patients and globally unique resource ids', async () => {
    const paths = await syntheaFixturePaths();
    assert.equal(paths.length, 12);

    const patientIds = new Set<string>();
    const resourceKeys = new Set<string>();
    let resourceCount = 0;

    for (const path of paths) {
      const bundle = await readSyntheaBundle(path);
      const id = patientId(bundle);
      assert.ok(id, `${path} must contain a Patient id`);
      assert.equal(patientIds.has(id), false, `duplicate Patient/${id}`);
      patientIds.add(id);

      for (const entry of bundle.entry) {
        const key = `${entry.resource.resourceType}/${entry.resource.id}`;
        assert.equal(resourceKeys.has(key), false, `duplicate ${key}`);
        resourceKeys.add(key);
        resourceCount += 1;
      }
    }

    assert.equal(patientIds.size, 12);
    assert.equal(resourceCount, 6925);
  });

  test('converts POST entries to tagged idempotent PUT entries', async () => {
    const [path] = await syntheaFixturePaths();
    const bundle = await readSyntheaBundle(path);
    const firstFullUrl = bundle.entry[0].fullUrl;
    assert.equal(bundle.entry[0].request.method, 'POST');

    const prepared = prepareSyntheaBundle(bundle);
    const first = prepared.entry[0];
    assert.equal(first.fullUrl, firstFullUrl);
    assert.equal(first.request.method, 'PUT');
    assert.equal(
      first.request.url,
      `${first.resource.resourceType}/${first.resource.id}`,
    );
    assert.ok(
      first.resource.meta?.tag?.some(
        (tag) =>
          tag.system === syntheaTag.system && tag.code === syntheaTag.code,
      ),
    );
  });

  test('builds deterministic resources for every conditional reference', async () => {
    const references = new Set<string>();
    for (const path of await syntheaFixturePaths()) {
      const bundle = await readSyntheaBundle(path);
      for (const reference of conditionalReferences(bundle)) {
        references.add(reference);
      }
    }

    const dependencies = buildDependencyBundle(references);
    assert.equal(dependencies.entry.length, 114);
    assert.deepEqual(
      Object.fromEntries(
        ['Practitioner', 'Organization', 'Location'].map((resourceType) => [
          resourceType,
          dependencies.entry.filter(
            (entry) => entry.resource.resourceType === resourceType,
          ).length,
        ]),
      ),
      { Practitioner: 38, Organization: 38, Location: 38 },
    );
    assert.ok(
      dependencies.entry.every(
        (entry) =>
          entry.request.method === 'PUT' &&
          entry.resource.meta?.tag?.some(
            (tag) =>
              tag.system === syntheaTag.system &&
              tag.code === syntheaTag.code,
          ),
      ),
    );
  });
});
