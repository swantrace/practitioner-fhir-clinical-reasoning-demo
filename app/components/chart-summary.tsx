import { codeText, patientAge } from '../fhir/format';

export function ClinicalSummary(props: {
  patient: fhir4.Patient;
  conditions: fhir4.Condition[];
  vitalSigns: fhir4.Observation[];
}) {
  const conditionNames = props.conditions.slice(0, 2).map(codeText);
  const bmi = props.vitalSigns.find((item) =>
    codeText(item).toLowerCase().includes('bmi'),
  );

  return (
    <section class="rounded-md border border-slate-200 bg-white p-4">
      <h2 class="section-title">Clinical summary</h2>
      <p class="mt-2 text-sm leading-6 text-slate-700">
        This patient is a {patientAge(props.patient)}-year-old{' '}
        {props.patient.gender ?? 'person'}
        {conditionNames.length
          ? ` with active ${conditionNames.join(' and ')}`
          : ' with no active conditions found'}
        .
        {bmi
          ? ` Latest BMI is ${bmi.valueQuantity?.value ?? 'recorded'}.`
          : ' Latest BMI was not found.'}
      </p>
    </section>
  );
}
