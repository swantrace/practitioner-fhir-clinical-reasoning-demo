import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  hasApplicableAction,
  waitUntilHypertensionPlanNotApplicable,
} from '../app/clinical-reasoning/hapi';

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
    assert.equal(
      hasApplicableAction({ resourceType: 'CarePlan', activity: [] }),
      false,
    );
  });

  test('ignores HAPI reference-only activity when its RequestGroup has no actions', () => {
    assert.equal(
      hasApplicableAction({
        resourceType: 'CarePlan',
        contained: [{ resourceType: 'RequestGroup' }],
        activity: [{ reference: { reference: '#hypertension-bp-followup' } }],
      }),
      false,
    );
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

  test('waits until a newly recorded observation changes applicability', async () => {
    let evaluations = 0;
    const updated = await waitUntilHypertensionPlanNotApplicable(
      'patient-123',
      async () => ({ ok: true, applicable: ++evaluations < 3 }),
      async () => undefined,
    );

    assert.equal(updated, true);
    assert.equal(evaluations, 3);
  });
});
