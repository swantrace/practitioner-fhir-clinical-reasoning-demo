# Hypertension blood-pressure follow-up

This directory contains the executable knowledge artifact for the MVP CDS
service.

`bun run clinical:compile` runs the pinned CQFramework translator, writes JSON
ELM under `elm/`, and packages the exact CQL and ELM bytes into the FHIR
`Library`. Commit all three representations together.

The rule compares exact SNOMED CT and LOINC codings rather than expanding a
ValueSet. This keeps the MVP deterministic and means the HAPI demo does not need
a complete SNOMED CT or LOINC terminology package.

The canonical identifiers must remain aligned:

- CQL library name: `HypertensionBpFollowup`
- FHIR Library URL: `https://example.org/fhir/Library/HypertensionBpFollowup`
- PlanDefinition ID: `hypertension-bp-followup`
- CQL applicability expression: `BloodPressureDocumentationMissing`

After compilation, use `bun run demo:setup` to install the Library and
PlanDefinition, reset the three fixture patients, and verify their real HAPI
`PlanDefinition/$apply` results.
