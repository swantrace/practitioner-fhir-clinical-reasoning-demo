export function patientName(patient: fhir4.Patient) {
  const name = patient.name?.[0];
  const given = name?.given?.join(' ') ?? '';
  return [given, name?.family].filter(Boolean).join(' ') || 'Unnamed patient';
}

export function patientAge(patient: fhir4.Patient) {
  if (!patient.birthDate) return 'Unknown';
  const birthDate = new Date(patient.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return Number.isFinite(age) ? String(age) : 'Unknown';
}

export function codeText(resource: {
  code?: fhir4.CodeableConcept;
  medicationCodeableConcept?: fhir4.CodeableConcept;
}) {
  const concept = resource.code ?? resource.medicationCodeableConcept;
  return (
    concept?.text ??
    concept?.coding?.[0]?.display ??
    concept?.coding?.[0]?.code ??
    'Unknown'
  );
}

export function observationValue(observation: fhir4.Observation) {
  const quantity = observation.valueQuantity;
  if (quantity) {
    return [quantity.value, quantity.unit ?? quantity.code]
      .filter(Boolean)
      .join(' ');
  }

  return (
    observation.valueString ??
    observation.valueCodeableConcept?.text ??
    'Not recorded'
  );
}
