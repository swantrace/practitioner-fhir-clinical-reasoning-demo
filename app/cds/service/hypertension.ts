import { applyHypertensionPlan } from '../../clinical-reasoning/hapi';
import type { CdsHooksResponse, PatientViewHookRequest } from '../types';

export type HypertensionServiceResult =
  | { ok: true; data: CdsHooksResponse }
  | { ok: false; message: string };

export async function evaluateHypertensionService(
  request: PatientViewHookRequest,
): Promise<HypertensionServiceResult> {
  const result = await applyHypertensionPlan(request.context.patientId);
  if (!result.ok) return result;

  if (!result.applicable) {
    return { ok: true, data: { cards: [] } };
  }

  return {
    ok: true,
    data: {
      cards: [
        {
          uuid: crypto.randomUUID(),
          summary: 'Blood pressure documentation may be missing',
          detail:
            'The patient has active hypertension, but no blood-pressure observation was found.',
          indicator: 'warning',
          source: {
            label: 'Hypertension Blood Pressure Follow-up',
          },
        },
      ],
    },
  };
}

export function parsePatientViewRequest(
  value: unknown,
): PatientViewHookRequest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const request = value as Partial<PatientViewHookRequest>;
  const context = request.context as
    | Partial<PatientViewHookRequest['context']>
    | undefined;

  if (
    request.hook !== 'patient-view' ||
    typeof request.hookInstance !== 'string' ||
    !request.hookInstance ||
    typeof context?.patientId !== 'string' ||
    !context.patientId ||
    typeof context.userId !== 'string' ||
    !context.userId
  ) {
    return undefined;
  }

  return request as PatientViewHookRequest;
}
