import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  PatientCreateDialog,
  PatientCreatePanel,
} from '../app/components/patient-create-panel';

describe('Patient creation dialog', () => {
  test('renders an accessible modal with HTMX form targeting', () => {
    const markup = String(PatientCreateDialog());

    assert.match(markup, /<dialog[^>]+id="patient-create-dialog"/);
    assert.match(markup, /aria-labelledby="patient-create-title"/);
    assert.match(markup, /aria-describedby="patient-create-description"/);
    assert.match(markup, /hx-post="\/patients"/);
    assert.match(markup, /hx-target="#patient-create-content"/);
    assert.match(markup, />Cancel<\/button>/);
  });

  test('preserves submitted values and identifies invalid fields', () => {
    const markup = String(
      PatientCreatePanel({
        errors: { firstName: 'First name is required.' },
        values: {
          firstName: '',
          lastName: 'Morgan',
          gender: 'unknown',
          birthDate: '1974-04-18',
        },
      }),
    );

    assert.match(
      markup,
      /<input(?=[^>]*name="firstName")(?=[^>]*aria-invalid="true")[^>]*>/,
    );
    assert.match(markup, /First name is required\./);
    assert.match(markup, /name="lastName"[^>]+value="Morgan"/);
    assert.match(markup, /option value="unknown" selected=""/);
  });
});
