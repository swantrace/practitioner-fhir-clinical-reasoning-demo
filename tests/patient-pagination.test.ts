import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  buildPatientSearchPath,
  mapPatientPage,
  PATIENT_PAGE_SIZE,
} from '../app/fhir/patient';
import { buildFhirUrl } from '../app/fhir/client';

describe('FHIR Patient pagination', () => {
  test('requests ten patients and only the list fields', () => {
    const path = buildPatientSearchPath({ name: 'Jane Doe' });
    const url = new URL(path ?? '', 'https://fhir.example.org/fhir/');

    assert.equal(url.pathname, '/fhir/Patient');
    assert.equal(url.searchParams.get('_count'), String(PATIENT_PAGE_SIZE));
    assert.equal(
      url.searchParams.get('_elements'),
      'active,birthDate,gender,id,name',
    );
    assert.equal(url.searchParams.get('name'), 'Jane Doe');
  });

  test('maps patients and opaque server paging links', () => {
    const bundle: fhir4.Bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 12,
      entry: [
        { resource: { resourceType: 'Patient', id: 'patient-1' } },
        { resource: { resourceType: 'Observation', id: 'ignored' } },
      ],
      link: [
        {
          relation: 'previous',
          url: 'http://private-hapi.internal/fhir/Patient?stateid=abc&page=1',
        },
        {
          relation: 'next',
          url: 'http://private-hapi.internal/fhir?_getpages=abc&_getpagesoffset=10&_count=10',
        },
      ],
    };

    const page = mapPatientPage(bundle);

    assert.deepEqual(page.patients.map((patient) => patient.id), ['patient-1']);
    assert.equal(page.total, 12);
    assert.ok(page.nextCursor);
    assert.equal(page.nextCursor.includes('private-hapi.internal'), false);
    assert.equal(
      buildPatientSearchPath({ cursor: page.nextCursor }),
      '?_getpages=abc&_getpagesoffset=10&_count=10',
    );
    assert.ok(page.previousCursor);
    assert.equal(
      buildPatientSearchPath({ cursor: page.previousCursor }),
      'Patient?stateid=abc&page=1',
    );
  });

  test('resolves HAPI base-level page links without adding a trailing slash', () => {
    assert.equal(
      buildFhirUrl(
        'http://hapi.internal:8080/fhir/',
        '?_getpages=abc&_getpagesoffset=10',
      ).toString(),
      'http://hapi.internal:8080/fhir?_getpages=abc&_getpagesoffset=10',
    );
  });

  test('rejects invalid cursors instead of constructing an arbitrary path', () => {
    assert.equal(buildPatientSearchPath({ cursor: 'not+a+cursor' }), undefined);
  });
});
