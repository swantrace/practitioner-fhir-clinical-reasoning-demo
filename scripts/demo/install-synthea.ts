import { basename } from 'node:path';
import { fhirRequest } from './fhir-client';
import {
  buildDependencyBundle,
  conditionalReferences,
  patientId,
  prepareSyntheaBundle,
  readSyntheaBundle,
  syntheaFixturePaths,
  type TransactionBundle,
} from './synthea';

type TransactionResponse = {
  resourceType?: string;
  type?: string;
  entry?: Array<{ response?: { status?: string } }>;
};

const paths = await syntheaFixturePaths();
if (paths.length !== 12) {
  throw new Error(`Expected 12 Synthea JSON files, found ${paths.length}.`);
}

const references = new Set<string>();
for (const path of paths) {
  const bundle = await readSyntheaBundle(path);
  for (const reference of conditionalReferences(bundle)) {
    references.add(reference);
  }
}
const dependencies = buildDependencyBundle(references);
const dependencyResponse = await fhirRequest<TransactionResponse>('', {
  method: 'POST',
  body: JSON.stringify(dependencies),
});
validateResponse(dependencyResponse, dependencies, 'Synthea dependencies');
console.log(
  `Installed ${dependencies.entry.length} referenced Practitioner, Organization, and Location resources.`,
);

let installedResources = 0;
for (const [index, path] of paths.entries()) {
  const bundle = prepareSyntheaBundle(await readSyntheaBundle(path));
  const id = patientId(bundle);
  const response = await fhirRequest<TransactionResponse>('', {
    method: 'POST',
    body: JSON.stringify(bundle),
  });
  validateResponse(response, bundle, basename(path));
  installedResources += bundle.entry.length;
  console.log(
    `Installed Synthea patient ${index + 1}/${paths.length}: ${id} (${bundle.entry.length} resources)`,
  );
}

console.log(
  `Synthea import complete: ${paths.length} patients and ${installedResources} idempotent resources installed.`,
);

function validateResponse(
  response: TransactionResponse,
  request: TransactionBundle,
  filename: string,
) {
  if (response.resourceType !== 'Bundle' || response.type !== 'transaction-response') {
    throw new Error(`${filename} did not return a transaction-response Bundle.`);
  }
  if (response.entry?.length !== request.entry.length) {
    throw new Error(
      `${filename} returned ${response.entry?.length ?? 0} entries; expected ${request.entry.length}.`,
    );
  }

  const failed = response.entry.filter(
    (entry) => !entry.response?.status?.match(/^2\d\d\b/),
  );
  if (failed.length) {
    throw new Error(`${filename} contains ${failed.length} failed entries.`);
  }
}
