import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { parsePatientViewRequest } from '../app/cds/service/hypertension';

describe('hypertension CDS service request validation', () => {
  test('accepts a valid patient-view request', () => {
    const request = parsePatientViewRequest({
      hook: 'patient-view',
      hookInstance: 'hook-123',
      context: {
        patientId: 'patient-123',
        userId: 'Practitioner/demo',
      },
    });

    assert.equal(request?.context.patientId, 'patient-123');
  });

  test('rejects a request without a patient', () => {
    assert.equal(
      parsePatientViewRequest({
        hook: 'patient-view',
        hookInstance: 'hook-123',
        context: { userId: 'Practitioner/demo' },
      }),
      undefined,
    );
  });
});
