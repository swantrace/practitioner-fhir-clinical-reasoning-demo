import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  fhirContinuationPath,
  searchAllFhirResources,
} from '../app/fhir/client';
import {
  buildVitalSignsSearchPath,
  sortVitalSigns,
} from '../app/fhir/chart';

describe('FHIR search pagination', () => {
  test('follows resource and base-level continuation links', async () => {
    const requestedPaths: string[] = [];
    const bundles = new Map<string, fhir4.Bundle>([
      [
        'Observation?patient=patient-1',
        bundle('observation-1', 'https://fhir.example.org/fhir/Observation?page=2'),
      ],
      [
        'Observation?page=2',
        bundle(
          'observation-2',
          'https://fhir.example.org/fhir?_getpages=opaque&page=3',
        ),
      ],
      ['?_getpages=opaque&page=3', bundle('observation-3')],
    ]);

    const result = await searchAllFhirResources<fhir4.Observation>(
      'Observation?patient=patient-1',
      'Observation',
      {
        baseUrl: 'https://fhir.example.org/fhir/',
        request: async (path) => {
          requestedPaths.push(path);
          const data = bundles.get(path);
          return data
            ? { ok: true, data }
            : { ok: false, status: 404, message: 'Unexpected page.' };
        },
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(
      result.data.map((observation) => observation.id),
      ['observation-1', 'observation-2', 'observation-3'],
    );
    assert.deepEqual(requestedPaths, [
      'Observation?patient=patient-1',
      'Observation?page=2',
      '?_getpages=opaque&page=3',
    ]);
  });

  test('rejects continuation links outside the configured FHIR base', () => {
    assert.equal(
      fhirContinuationPath(
        'https://fhir.example.org/fhir/',
        'https://attacker.example/Observation?page=2',
      ),
      undefined,
    );
    assert.equal(
      fhirContinuationPath(
        'https://fhir.example.org/fhir/',
        'https://fhir.example.org/admin?page=2',
      ),
      undefined,
    );
  });

  test('requests larger newest-first vital-sign pages', () => {
    const url = new URL(
      buildVitalSignsSearchPath('patient/with special?characters'),
      'https://fhir.example.org/fhir/',
    );

    assert.equal(url.pathname, '/fhir/Observation');
    assert.equal(url.searchParams.get('patient'), 'patient/with special?characters');
    assert.equal(url.searchParams.get('category'), 'vital-signs');
    assert.equal(url.searchParams.get('_sort'), '-date');
    assert.equal(url.searchParams.get('_count'), '100');
  });

  test('sorts combined observations by clinical time descending', () => {
    const observations: fhir4.Observation[] = [
      observation('undated'),
      observation('older', { effectiveDateTime: '2025-01-01T00:00:00Z' }),
      observation('newest', { issued: '2026-02-01T00:00:00Z' }),
      observation('middle', {
        effectivePeriod: { start: '2025-06-01T00:00:00Z' },
      }),
    ];

    assert.deepEqual(
      sortVitalSigns(observations).map((item) => item.id),
      ['newest', 'middle', 'older', 'undated'],
    );
  });
});

function bundle(id: string, next?: string): fhir4.Bundle {
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    entry: [{ resource: observation(id) }],
    link: next ? [{ relation: 'next', url: next }] : undefined,
  };
}

function observation(
  id: string,
  values: Partial<fhir4.Observation> = {},
): fhir4.Observation {
  return {
    resourceType: 'Observation',
    id,
    status: 'final',
    code: { text: 'Vital sign' },
    ...values,
  };
}
