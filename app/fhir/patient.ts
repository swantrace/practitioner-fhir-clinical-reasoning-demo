import { bundleEntries, fhirRequest } from './client';
import type { FhirResult, PatientInput, PatientPage } from './types';

export const PATIENT_PAGE_SIZE = 10;

export async function listPatients(
  options: { name?: string; cursor?: string } = {},
): Promise<FhirResult<PatientPage>> {
  const path = buildPatientSearchPath(options);
  if (!path) {
    return {
      ok: false,
      status: 400,
      message: 'This patient page link is invalid. Start the search again.',
    };
  }

  const result = await fhirRequest<fhir4.Bundle>(path);
  return result.ok ? { ok: true, data: mapPatientPage(result.data) } : result;
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

export function buildPatientSearchPath(options: {
  name?: string;
  cursor?: string;
}) {
  if (options.cursor) {
    return decodeCursor(options.cursor);
  }

  const params = new URLSearchParams({
    _count: String(PATIENT_PAGE_SIZE),
    _elements: 'active,birthDate,gender,id,name',
  });
  if (options.name) params.set('name', options.name);

  return `Patient?${params}`;
}

export function mapPatientPage(bundle: fhir4.Bundle): PatientPage {
  return {
    patients: bundleEntries<fhir4.Patient>(bundle, 'Patient'),
    total: bundle.total,
    nextCursor: cursorFor(bundle, 'next'),
    previousCursor: cursorFor(bundle, 'previous'),
  };
}

function cursorFor(bundle: fhir4.Bundle, relation: string) {
  const link = bundle.link?.find((item) => item.relation === relation)?.url;
  if (!link) return undefined;

  try {
    const url = new URL(link, 'http://fhir.local');
    const scope = url.pathname.endsWith('/Patient') ? 'patient' : 'base';
    return Buffer.from(
      JSON.stringify({ scope, query: url.searchParams.toString() }),
    ).toString('base64url');
  } catch {
    return undefined;
  }
}

function decodeCursor(cursor: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(cursor) || cursor.length > 8_192) {
    return undefined;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { scope?: unknown; query?: unknown };
    if (
      (payload.scope !== 'base' && payload.scope !== 'patient') ||
      typeof payload.query !== 'string'
    ) {
      return undefined;
    }

    const params = new URLSearchParams(payload.query);
    if (!params.size) return undefined;

    const resource = payload.scope === 'patient' ? 'Patient' : '';
    return `${resource}?${params}`;
  } catch {
    return undefined;
  }
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
