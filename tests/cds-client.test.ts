import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { buildPatientViewRequest } from '../app/cds/client/build-patient-view-request';
import { invokeCdsService } from '../app/cds/client/invoke-service';

describe('CDS Hooks client', () => {
  test('builds a patient-view request', () => {
    const request = buildPatientViewRequest({
      patientId: 'patient-123',
      userId: 'Practitioner/demo',
      fhirServer: 'https://fhir.example.org/',
      hookInstance: 'hook-123',
    });

    assert.deepEqual(request, {
      hook: 'patient-view',
      hookInstance: 'hook-123',
      fhirServer: 'https://fhir.example.org/',
      context: {
        patientId: 'patient-123',
        userId: 'Practitioner/demo',
      },
    });
  });

  test('invokes the configured CDS service over HTTP', async () => {
    let requestedUrl = '';
    const result = await invokeCdsService({
      baseUrl: 'https://cds.example.org/base/',
      serviceId: 'hypertension-bp-followup',
      request: buildPatientViewRequest({
        patientId: 'patient-123',
        userId: 'Practitioner/demo',
        fhirServer: 'https://fhir.example.org/',
        hookInstance: 'hook-123',
      }),
      fetcher: (async (input) => {
        requestedUrl = String(input);
        return new Response(JSON.stringify({ cards: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }) as typeof fetch,
    });

    assert.equal(requestedUrl, 'https://cds.example.org/base/cds-services/hypertension-bp-followup');
    assert.deepEqual(result, { ok: true, data: { cards: [] } });
  });
});
