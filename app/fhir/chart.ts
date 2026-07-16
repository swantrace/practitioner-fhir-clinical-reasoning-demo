import { bundleEntries, fhirRequest, searchAllFhirResources } from './client';
import { getPatient } from './patient';
import type { FhirResult, PatientChartData } from './types';

export async function getPatientChart(
  patientId: string,
): Promise<FhirResult<PatientChartData>> {
  const patientReference = encodeURIComponent(patientId);
  const [patient, observations, conditions, medications] = await Promise.all([
    getPatient(patientId),
    searchAllFhirResources<fhir4.Observation>(
      buildVitalSignsSearchPath(patientId),
      'Observation',
    ),
    fhirRequest<fhir4.Bundle>(
      `Condition?patient=${patientReference}&clinical-status=active`,
    ),
    fhirRequest<fhir4.Bundle>(
      `MedicationRequest?patient=${patientReference}&status=active`,
    ),
  ]);

  if (!patient.ok) return patient;
  if (!observations.ok) return observations;
  if (!conditions.ok) return conditions;
  if (!medications.ok) return medications;

  return {
    ok: true,
    data: {
      patient: patient.data,
      vitalSigns: sortVitalSigns(observations.data),
      conditions: bundleEntries<fhir4.Condition>(conditions.data, 'Condition'),
      medications: bundleEntries<fhir4.MedicationRequest>(
        medications.data,
        'MedicationRequest',
      ),
    },
  };
}

export function buildVitalSignsSearchPath(patientId: string) {
  const params = new URLSearchParams({
    patient: patientId,
    category: 'vital-signs',
    _sort: '-date',
    _count: '100',
  });
  return `Observation?${params}`;
}

export function sortVitalSigns(observations: fhir4.Observation[]) {
  return [...observations].sort(
    (left, right) => observationTime(right) - observationTime(left),
  );
}

function observationTime(observation: fhir4.Observation) {
  const value =
    observation.effectiveDateTime ??
    observation.effectivePeriod?.start ??
    observation.issued;
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}
