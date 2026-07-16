import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  validateCardsResponse,
  validateDiscovery,
} from '../scripts/demo/cds-response';

describe('CDS Hooks response verification', () => {
  test('accepts discovery and a valid warning card', () => {
    assert.doesNotThrow(() =>
      validateDiscovery(
        {
          services: [
            {
              id: 'hypertension-bp-followup',
              hook: 'patient-view',
              title: 'Hypertension follow-up',
              description: 'Checks blood-pressure documentation.',
            },
          ],
        },
        'hypertension-bp-followup',
      ),
    );

    assert.doesNotThrow(() =>
      validateCardsResponse({
        cards: [
          {
            summary: 'Blood pressure documentation may be missing',
            detail: 'No blood-pressure observation was found.',
            indicator: 'warning',
            source: { label: 'Hypertension follow-up' },
          },
        ],
      }),
    );
  });

  test('accepts the standard empty cards response', () => {
    assert.deepEqual(validateCardsResponse({ cards: [] }), { cards: [] });
  });

  test('rejects malformed cards', () => {
    assert.throws(
      () =>
        validateCardsResponse({
          cards: [
            {
              summary: '',
              indicator: 'danger',
              source: {},
            },
          ],
        }),
      /summary must be a non-empty string/,
    );
  });
});
