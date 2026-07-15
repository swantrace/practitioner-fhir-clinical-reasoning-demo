import { bundleEntries, fhirRequest } from './client';
import { getPatient } from './patient';
import type { FhirResult, PatientChartData } from './types';

export async function getPatientChart(
  patientId: string,
): Promise<FhirResult<PatientChartData>> {
  const [patient, observations, conditions, medications] = await Promise.all([
    getPatient(patientId),
    fhirRequest<fhir4.Bundle>(
      `Observation?patient=${patientId}&category=vital-signs`,
    ),
    fhirRequest<fhir4.Bundle>(
      `Condition?patient=${patientId}&clinical-status=active`,
    ),
    fhirRequest<fhir4.Bundle>(
      `MedicationRequest?patient=${patientId}&status=active`,
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
      vitalSigns: bundleEntries<fhir4.Observation>(
        observations.data,
        'Observation',
      ),
      conditions: bundleEntries<fhir4.Condition>(conditions.data, 'Condition'),
      medications: bundleEntries<fhir4.MedicationRequest>(
        medications.data,
        'MedicationRequest',
      ),
    },
  };
}
