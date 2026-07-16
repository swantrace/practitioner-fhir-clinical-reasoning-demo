import type { BloodPressureInput } from '../fhir/types';

export type BloodPressureValidation =
  | { ok: true; data: BloodPressureInput }
  | {
      ok: false;
      errors: Record<string, string>;
      values: Record<'systolic' | 'diastolic', string>;
    };

export function validateBloodPressureForm(
  formData: FormData,
): BloodPressureValidation {
  const values = {
    systolic: stringField(formData, 'systolic'),
    diastolic: stringField(formData, 'diastolic'),
  };
  const systolic = integer(values.systolic);
  const diastolic = integer(values.diastolic);
  const errors: Record<string, string> = {};

  if (systolic === undefined || systolic < 50 || systolic > 300) {
    errors.systolic = 'Enter a whole number between 50 and 300 mmHg.';
  }
  if (diastolic === undefined || diastolic < 30 || diastolic > 200) {
    errors.diastolic = 'Enter a whole number between 30 and 200 mmHg.';
  }
  if (
    systolic !== undefined &&
    diastolic !== undefined &&
    !errors.systolic &&
    !errors.diastolic &&
    systolic <= diastolic
  ) {
    errors.diastolic =
      'Diastolic pressure must be lower than systolic pressure.';
  }

  return Object.keys(errors).length
    ? { ok: false, errors, values }
    : {
        ok: true,
        data: { systolic: systolic as number, diastolic: diastolic as number },
      };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function integer(value: string) {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
