import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { hasApplicableAction } from '../app/clinical-reasoning/hapi';

describe('HAPI PlanDefinition result mapping', () => {
  test('detects an applicable CarePlan activity', () => {
    assert.equal(
      hasApplicableAction({
        resourceType: 'CarePlan',
        activity: [{ detail: { description: 'Record blood pressure' } }],
      }),
      true,
    );
  });

  test('returns false for a CarePlan with no applicable activity', () => {
    assert.equal(hasApplicableAction({ resourceType: 'CarePlan', activity: [] }), false);
  });

  test('detects actions nested in a transaction result Bundle', () => {
    assert.equal(
      hasApplicableAction({
        resourceType: 'Bundle',
        entry: [
          {
            resource: {
              resourceType: 'RequestGroup',
              action: [{ title: 'Record blood pressure' }],
            },
          },
        ],
      }),
      true,
    );
  });
});
