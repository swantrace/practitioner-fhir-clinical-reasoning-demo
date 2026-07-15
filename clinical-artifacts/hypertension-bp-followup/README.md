# Hypertension blood-pressure follow-up

This directory contains the source knowledge artifact for the MVP CDS service.

The CQL source must be translated to ELM and packaged into the FHIR `Library`
before the `Library` and `PlanDefinition` are installed on HAPI FHIR. The old
JavaScript engine's ELM file was intentionally not migrated because it contained
no executable statements.

The canonical identifiers must remain aligned:

- CQL library name: `HypertensionBpFollowup`
- FHIR Library URL: `https://example.org/fhir/Library/HypertensionBpFollowup`
- PlanDefinition ID: `hypertension-bp-followup`
- CQL applicability expression: `BloodPressureDocumentationMissing`
