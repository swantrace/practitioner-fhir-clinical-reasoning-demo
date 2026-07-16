import { fhirRequest } from './client';
import type { BloodPressureInput } from './types';

const demoTag = {
  system: 'https://example.org/fhir/demo-dataset',
  code: 'hypertension-cds-v1',
};

export function buildBloodPressureObservation(
  patientId: string,
  input: BloodPressureInput,
  measuredAt = new Date(),
): fhir4.Observation {
  return {
    resourceType: 'Observation',
    meta: { tag: [demoTag] },
    status: 'final',
    category: [
      {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel with all children optional',
        },
      ],
      text: 'Blood pressure',
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: measuredAt.toISOString(),
    component: [
      component('8480-6', 'Systolic blood pressure', input.systolic),
      component('8462-4', 'Diastolic blood pressure', input.diastolic),
    ],
  };
}

export function createBloodPressureObservation(
  patientId: string,
  input: BloodPressureInput,
) {
  return fhirRequest<fhir4.Observation>('Observation', {
    method: 'POST',
    body: buildBloodPressureObservation(patientId, input),
  });
}

export async function waitForObservationSearchIndex(
  patientId: string,
  observationId: string | undefined,
) {
  if (!observationId) return false;

  const query = new URLSearchParams({
    _id: observationId,
    patient: patientId,
    _count: '1',
    _elements: 'id',
  });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await fhirRequest<fhir4.Bundle>(`Observation?${query}`);
    if (
      result.ok &&
      result.data.entry?.some(
        (entry) =>
          entry.resource?.resourceType === 'Observation' &&
          entry.resource.id === observationId,
      )
    ) {
      return true;
    }

    await delay(400);
  }

  return false;
}

function component(
  code: string,
  display: string,
  value: number,
): fhir4.ObservationComponent {
  return {
    code: {
      coding: [{ system: 'http://loinc.org', code, display }],
      text: display,
    },
    valueQuantity: {
      value,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]',
    },
  };
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
