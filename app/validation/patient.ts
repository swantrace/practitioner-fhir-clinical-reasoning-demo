import type { PatientInput } from '../fhir/types';

const genders = new Set(['male', 'female', 'other', 'unknown']);

export type PatientValidation =
  | { ok: true; data: PatientInput }
  | {
      ok: false;
      errors: Record<string, string>;
      values: Partial<PatientInput>;
    };

export async function validatePatientForm(
  formData: FormData,
): Promise<PatientValidation> {
  const values = {
    firstName: stringField(formData, 'firstName'),
    lastName: stringField(formData, 'lastName'),
    gender: stringField(formData, 'gender') as PatientInput['gender'],
    birthDate: stringField(formData, 'birthDate'),
  };
  const errors: Record<string, string> = {};

  if (!values.firstName) errors.firstName = 'First name is required.';
  if (!values.lastName) errors.lastName = 'Last name is required.';
  if (!genders.has(values.gender ?? ''))
    errors.gender = 'Select a supported gender.';
  if (!isValidBirthDate(values.birthDate))
    errors.birthDate = 'Enter a valid date not in the future.';

  return Object.keys(errors).length
    ? { ok: false, errors, values }
    : { ok: true, data: values };
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function isValidBirthDate(value: string) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  return !Number.isNaN(date.getTime()) && date <= today;
}
