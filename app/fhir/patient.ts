import { bundleEntries, fhirRequest } from './client';
import type { FhirResult, PatientInput } from './types';

export async function listPatients(name?: string) {
  const params = name ? `?name=${encodeURIComponent(name)}` : '';
  const result = await fhirRequest<fhir4.Bundle>(`Patient${params}`);
  return mapBundle<fhir4.Patient>(result, 'Patient');
}

export async function getPatient(id: string) {
  return fhirRequest<fhir4.Patient>(`Patient/${encodeURIComponent(id)}`);
}

export async function createPatient(input: PatientInput) {
  return fhirRequest<fhir4.Patient>('Patient', {
    method: 'POST',
    body: toPatient(input),
  });
}

export async function updatePatient(id: string, input: PatientInput) {
  return fhirRequest<fhir4.Patient>(`Patient/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { ...toPatient(input), id },
  });
}

export async function deactivatePatient(patient: fhir4.Patient) {
  return fhirRequest<fhir4.Patient>(`Patient/${patient.id}`, {
    method: 'PUT',
    body: { ...patient, active: false },
  });
}

function mapBundle<T extends fhir4.Resource>(
  result: FhirResult<fhir4.Bundle>,
  resourceType: T['resourceType'],
): FhirResult<T[]> {
  return result.ok
    ? { ok: true, data: bundleEntries<T>(result.data, resourceType) }
    : result;
}

function toPatient(input: PatientInput): fhir4.Patient {
  return {
    resourceType: 'Patient',
    active: true,
    name: [{ given: [input.firstName], family: input.lastName }],
    gender: input.gender,
    birthDate: input.birthDate,
  };
}
