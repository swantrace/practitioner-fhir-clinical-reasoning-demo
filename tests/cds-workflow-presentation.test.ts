import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { demoScenarioForPatient } from '../app/cds/demo-scenarios';
import type { CdsCard, CdsCardsResult } from '../app/cds/types';
import { CdsCards } from '../app/components/cds-cards';
import { PatientTable } from '../app/components/patient-table';

describe('Hypertension care-gap presentation', () => {
  test('identifies the three stable demo scenarios without FHIR calls', () => {
    assert.equal(
      demoScenarioForPatient('hypertension-missing-bp')?.id,
      'care-gap',
    );
    assert.equal(
      demoScenarioForPatient('hypertension-with-bp')?.id,
      'documented-bp',
    );
    assert.equal(demoScenarioForPatient('no-hypertension')?.id, 'control');
    assert.equal(demoScenarioForPatient('synthea-patient'), undefined);
  });

  test('renders a prominent warning and record action', () => {
    const card: CdsCard = {
      summary: 'Hypertension care gap: blood pressure documentation missing',
      detail: 'Record a current measurement to close this care gap.',
      indicator: 'warning',
      source: { label: 'Hypertension Blood Pressure Follow-up' },
    };
    const markup = String(
      CdsCards({
        patientId: 'hypertension-missing-bp',
        result: { ok: true, data: [card] },
      }),
    );

    assert.match(markup, /Needs attention/);
    assert.match(markup, /Hypertension care gap/);
    assert.match(markup, /Record blood pressure/);
  });

  test('explains resolved, comparison, and control outcomes', () => {
    const emptyResult: CdsCardsResult = { ok: true, data: [] };

    assert.match(
      String(
        CdsCards({
          patientId: 'hypertension-missing-bp',
          result: emptyResult,
        }),
      ),
      /Care gap resolved/,
    );
    assert.match(
      String(
        CdsCards({ patientId: 'hypertension-with-bp', result: emptyResult }),
      ),
      /Up to date/,
    );
    assert.match(
      String(CdsCards({ patientId: 'no-hypertension', result: emptyResult })),
      /Rule not applicable/,
    );
  });

  test('does not expose CDS conclusions in the patient list', () => {
    const markup = String(
      PatientTable({
        patients: [
          {
            resourceType: 'Patient',
            id: 'hypertension-missing-bp',
            active: true,
            gender: 'male',
            birthDate: '1980-01-01',
            name: [{ given: ['Alex'], family: 'Morgan' }],
          },
        ],
      }),
    );
    const visibleText = markup.replace(/<[^>]*>/g, ' ');

    assert.match(visibleText, /Alex Morgan/);
    assert.match(visibleText, /View \/ edit/);
    assert.doesNotMatch(visibleText, /care gap/i);
    assert.doesNotMatch(visibleText, /hypertension/i);
    assert.doesNotMatch(visibleText, /CDS Hooks/i);
  });
});
