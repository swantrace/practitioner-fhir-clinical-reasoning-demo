export type DemoScenario = {
  actionLabel: string;
  description: string;
  id: 'care-gap' | 'documented-bp' | 'control';
  label: string;
};

const scenarios: Record<string, DemoScenario> = {
  'hypertension-missing-bp': {
    id: 'care-gap',
    label: 'Start here · Care gap',
    description: 'Active hypertension · BP initially missing',
    actionLabel: 'Review care gap',
  },
  'hypertension-with-bp': {
    id: 'documented-bp',
    label: 'Comparison · BP documented',
    description: 'Active hypertension · BP available',
    actionLabel: 'View comparison',
  },
  'no-hypertension': {
    id: 'control',
    label: 'Control · No hypertension',
    description: 'CDS rule is not applicable',
    actionLabel: 'View control',
  },
};

export function demoScenarioForPatient(patientId: string | undefined) {
  return patientId ? scenarios[patientId] : undefined;
}
