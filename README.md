# Practitioner FHIR Clinical Reasoning Demo

A practitioner-facing HonoX application that uses HAPI FHIR Clinical Reasoning
to evaluate a hypertension blood-pressure documentation rule and presents the
result through a CDS Hooks `patient-view` workflow.

## Architecture

```text
Browser
  -> POST /api/patients/{id}/cds-cards
  -> HonoX CDS Client
  -> POST /cds-services/hypertension-bp-followup
  -> HonoX CDS Service adapter
  -> HAPI PlanDefinition/$apply
  -> CDS Hooks Cards
```

HAPI FHIR owns FHIR persistence and CQL execution. HonoX owns the practitioner
experience, CDS Hooks protocol boundary, and mapping Clinical Reasoning output
to cards.

## Local configuration

Copy `.env.example` to `.env` and point `FHIR_BASE_URL` at a HAPI FHIR R4 server
with Clinical Reasoning enabled. `FHIR_BEARER_TOKEN` is optional for an
unsecured local server and required when the remote server is protected.

```sh
bun install
bun run dev
```

The optional Compose service starts a local HAPI image:

```sh
docker compose up hapi-fhir
```

## Knowledge artifact

The source artifact is under
`clinical-artifacts/hypertension-bp-followup`. Translate the CQL to ELM, add the
ELM attachment to the FHIR Library, and install the Library and PlanDefinition
on HAPI before invoking the service. The repository does not treat the old
empty JavaScript-engine ELM placeholder as executable content.

## Verification

```sh
bun run typecheck
bun test
bun run build
```
