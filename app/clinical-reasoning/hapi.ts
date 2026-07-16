import { fhirRequest } from '../fhir/client';
import { getUiEnv } from '../lib/env';

export type PlanDefinitionApplyResult =
  | { ok: true; applicable: boolean }
  | { ok: false; message: string };

export async function applyHypertensionPlan(
  patientId: string,
): Promise<PlanDefinitionApplyResult> {
  const { hapiPlanDefinitionId } = getUiEnv();
  const query = new URLSearchParams({
    subject: `Patient/${patientId}`,
    useServerData: 'true',
  });
  const path = `PlanDefinition/${encodeURIComponent(hapiPlanDefinitionId)}/$apply?${query}`;
  const result = await fhirRequest<unknown>(path);

  if (!result.ok) {
    return {
      ok: false,
      message: `HAPI Clinical Reasoning failed${result.status ? ` with status ${result.status}` : ''}.`,
    };
  }

  return { ok: true, applicable: hasApplicableAction(result.data) };
}

export function hasApplicableAction(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;

  if (Array.isArray(value)) {
    return value.some(hasApplicableAction);
  }

  const resource = value as Record<string, unknown>;
  const resourceType = resource.resourceType;

  if (resourceType === 'CarePlan') {
    if (hasApplicableAction(resource.contained)) return true;

    // HAPI always adds a reference-only CarePlan activity that points to the
    // contained RequestGroup, even when every PlanDefinition action is filtered
    // out. Only a direct inline activity detail is independently actionable.
    return (
      Array.isArray(resource.activity) &&
      resource.activity.some(
        (activity) =>
          activity !== null &&
          typeof activity === 'object' &&
          'detail' in activity,
      )
    );
  }

  if (
    resourceType === 'RequestGroup' ||
    resourceType === 'RequestOrchestration'
  ) {
    return nonEmpty(resource.action);
  }

  if (resourceType === 'Bundle') {
    return hasApplicableAction(resource.entry);
  }

  if (resourceType === 'Parameters') {
    return hasApplicableAction(resource.parameter);
  }

  if ('resource' in resource && hasApplicableAction(resource.resource))
    return true;
  if (
    'valueResource' in resource &&
    hasApplicableAction(resource.valueResource)
  )
    return true;

  return false;
}

function nonEmpty(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}
