export type PatientInput = {
  firstName: string;
  lastName: string;
  gender: fhir4.Patient['gender'];
  birthDate: string;
};

export type BloodPressureInput = {
  systolic: number;
  diastolic: number;
};

export type FhirResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status?: number };

export type PatientChartData = {
  patient: fhir4.Patient;
  vitalSigns: fhir4.Observation[];
  conditions: fhir4.Condition[];
  medications: fhir4.MedicationRequest[];
};

export type PatientPage = {
  patients: fhir4.Patient[];
  total?: number;
  nextCursor?: string;
  previousCursor?: string;
};
