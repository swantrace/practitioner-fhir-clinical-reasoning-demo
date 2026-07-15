import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type UiEnv = {
  fhirBaseUrl: string;
  fhirBearerToken?: string;
  cdsServiceBaseUrl?: string;
  cdsUserId: string;
  hapiPlanDefinitionId: string;
};

export function getUiEnv(): UiEnv {
  const fhirBaseUrl = envValue('FHIR_BASE_URL');
  const fhirBearerToken = envValue('FHIR_BEARER_TOKEN');

  if (!fhirBaseUrl) {
    throw new Error('FHIR_BASE_URL must be configured.');
  }

  return {
    fhirBaseUrl,
    fhirBearerToken,
    cdsServiceBaseUrl: envValue('CDS_SERVICE_BASE_URL'),
    cdsUserId: envValue('CDS_USER_ID') ?? 'Practitioner/demo',
    hapiPlanDefinitionId:
      envValue('HAPI_PLAN_DEFINITION_ID') ?? 'hypertension-bp-followup',
  };
}

function envValue(key: string) {
  const viteEnv = import.meta.env as Record<string, string | undefined>;
  return unquote(process.env[key] ?? viteEnv[key] ?? localEnv()[key]);
}

function unquote(value: string | undefined) {
  if (!value) return value;
  return value.replace(/^["']|["']$/g, '');
}

let cachedLocalEnv: Record<string, string> | undefined;

function localEnv() {
  if (cachedLocalEnv) return cachedLocalEnv;

  for (const path of [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
  ]) {
    try {
      cachedLocalEnv = parseEnvFile(readFileSync(path, 'utf8'));
      return cachedLocalEnv;
    } catch {
      // Try the next location. The parent lookup supports production runs from dist/.
    }
  }

  cachedLocalEnv = {};
  return cachedLocalEnv;
}

function parseEnvFile(content: string) {
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), unquote(line.slice(index + 1)) ?? ''];
      }),
  );
}
