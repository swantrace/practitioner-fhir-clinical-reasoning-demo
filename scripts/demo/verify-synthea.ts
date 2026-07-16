import { fhirRequest } from './fhir-client';
import {
  patientId,
  readSyntheaBundle,
  syntheaFixturePaths,
  syntheaTag,
} from './synthea';

type Patient = {
  resourceType?: string;
  id?: string;
  meta?: { tag?: Array<{ system?: string; code?: string }> };
};

type SearchBundle = {
  resourceType?: string;
  total?: number;
  entry?: Array<{ resource?: { id?: string } }>;
};

const paths = await syntheaFixturePaths();
const expectedIds = new Set<string>();
for (const path of paths) {
  const id = patientId(await readSyntheaBundle(path));
  if (!id) throw new Error(`${path} does not contain a Patient id.`);
  expectedIds.add(id);
}
if (expectedIds.size !== 12) {
  throw new Error(`Expected 12 unique Synthea Patient ids, found ${expectedIds.size}.`);
}

const tag = encodeURIComponent(`${syntheaTag.system}|${syntheaTag.code}`);
const tagged = await fhirRequest<SearchBundle>(
  `Patient?_tag=${tag}&_count=50&_elements=id`,
);
const taggedIds = new Set(
  tagged.entry?.map((entry) => entry.resource?.id).filter(Boolean),
);

for (const [index, id] of [...expectedIds].sort().entries()) {
  const patient = await fhirRequest<Patient>(`Patient/${encodeURIComponent(id)}`);
  if (patient.resourceType !== 'Patient' || patient.id !== id) {
    throw new Error(`Patient/${id} was not installed correctly.`);
  }
  if (
    !patient.meta?.tag?.some(
      (candidate) =>
        candidate.system === syntheaTag.system &&
        candidate.code === syntheaTag.code,
    ) ||
    !taggedIds.has(id)
  ) {
    throw new Error(`Patient/${id} is missing the Synthea dataset tag.`);
  }

  const observations = await fhirRequest<SearchBundle>(
    `Observation?patient=${encodeURIComponent(id)}&_summary=count`,
  );
  if (!observations.total) {
    throw new Error(`Patient/${id} has no imported Observations.`);
  }

  console.log(
    `PASS Synthea patient ${index + 1}/${expectedIds.size}: ${id} (${observations.total} observations)`,
  );
}

for (const resourceType of ['Practitioner', 'Organization', 'Location']) {
  const dependencies = await fhirRequest<SearchBundle>(
    `${resourceType}?_tag=${tag}&_summary=count`,
  );
  if (dependencies.total !== 38) {
    throw new Error(
      `Expected 38 tagged ${resourceType} resources, found ${dependencies.total ?? 0}.`,
    );
  }
}

console.log(
  'Verification complete: all 12 Synthea patients and 114 referenced resources are available.',
);
