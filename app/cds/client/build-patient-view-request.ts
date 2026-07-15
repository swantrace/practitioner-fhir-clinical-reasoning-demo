import type { PatientViewHookRequest } from '../types';

export function buildPatientViewRequest(input: {
  patientId: string;
  userId: string;
  fhirServer: string;
  hookInstance?: string;
}): PatientViewHookRequest {
  return {
    hook: 'patient-view',
    hookInstance: input.hookInstance ?? crypto.randomUUID(),
    fhirServer: input.fhirServer,
    context: {
      patientId: input.patientId,
      userId: input.userId,
    },
  };
}
