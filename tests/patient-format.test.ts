import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { patientName } from '../app/fhir/format';

describe('Patient name formatting', () => {
  test('removes Synthea numeric name suffixes for display', () => {
    const patient: fhir4.Patient = {
      resourceType: 'Patient',
      meta: {
        tag: [
          {
            system: 'https://example.org/fhir/demo-dataset',
            code: 'synthea-12-v1',
          },
        ],
      },
      name: [{ given: ['Anderson154', 'Erich201'], family: 'Senger904' }],
    };

    assert.equal(patientName(patient), 'Anderson Erich Senger');
  });

  test('preserves names from non-Synthea Patient resources', () => {
    const patient: fhir4.Patient = {
      resourceType: 'Patient',
      name: [{ given: ['Example2'], family: 'Person3' }],
    };

    assert.equal(patientName(patient), 'Example2 Person3');
  });
});
