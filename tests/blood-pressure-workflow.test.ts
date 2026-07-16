import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildBloodPressureObservation } from '../app/fhir/observation';
import { observationValue } from '../app/fhir/format';
import { validateBloodPressureForm } from '../app/validation/blood-pressure';

describe('blood-pressure closed-loop workflow', () => {
  test('validates plausible integer measurements', () => {
    const formData = new FormData();
    formData.set('systolic', '132');
    formData.set('diastolic', '84');

    assert.deepEqual(validateBloodPressureForm(formData), {
      ok: true,
      data: { systolic: 132, diastolic: 84 },
    });
  });

  test('rejects out-of-range and reversed measurements', () => {
    const outOfRange = new FormData();
    outOfRange.set('systolic', '301');
    outOfRange.set('diastolic', '20');
    const rangeResult = validateBloodPressureForm(outOfRange);
    assert.equal(rangeResult.ok, false);
    if (!rangeResult.ok) {
      assert.match(rangeResult.errors.systolic, /between 50 and 300/);
      assert.match(rangeResult.errors.diastolic, /between 30 and 200/);
    }

    const reversed = new FormData();
    reversed.set('systolic', '80');
    reversed.set('diastolic', '90');
    const reversedResult = validateBloodPressureForm(reversed);
    assert.equal(reversedResult.ok, false);
    if (!reversedResult.ok) {
      assert.match(reversedResult.errors.diastolic, /lower than systolic/);
    }
  });

  test('builds a tagged FHIR R4 blood-pressure panel Observation', () => {
    const observation = buildBloodPressureObservation(
      'hypertension-missing-bp',
      { systolic: 132, diastolic: 84 },
      new Date('2026-07-15T18:30:00.000Z'),
    );

    assert.equal(observation.status, 'final');
    assert.equal(observation.subject?.reference, 'Patient/hypertension-missing-bp');
    assert.equal(observation.effectiveDateTime, '2026-07-15T18:30:00.000Z');
    assert.ok(
      observation.category?.[0]?.coding?.some(
        (coding) => coding.code === 'vital-signs',
      ),
    );
    assert.ok(
      observation.code?.coding?.some(
        (coding) =>
          coding.system === 'http://loinc.org' && coding.code === '85354-9',
      ),
    );
    assert.deepEqual(
      observation.component?.map((component) => ({
        code: component.code.coding?.[0]?.code,
        value: component.valueQuantity?.value,
        unit: component.valueQuantity?.code,
      })),
      [
        { code: '8480-6', value: 132, unit: 'mm[Hg]' },
        { code: '8462-4', value: 84, unit: 'mm[Hg]' },
      ],
    );
    assert.deepEqual(observation.meta?.tag, [
      {
        system: 'https://example.org/fhir/demo-dataset',
        code: 'hypertension-cds-v1',
      },
    ]);
    assert.equal(observationValue(observation), '132/84 mmHg');
  });
});
