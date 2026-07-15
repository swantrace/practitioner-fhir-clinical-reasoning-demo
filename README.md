# Practitioner FHIR Clinical Reasoning Demo

A practitioner-facing HonoX application that uses HAPI FHIR Clinical Reasoning
to evaluate a hypertension blood-pressure documentation rule and presents the
result through a CDS Hooks `patient-view` workflow.

The application is built and served directly by Bun using Hono's Web Standard
`fetch` interface; it does not require a Node HTTP server adapter.

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

To run the local Practitioner UI against the private HAPI service on Fly, first
authenticate the Fly CLI and set `FHIR_BASE_URL` in `.env` to
`http://127.0.0.1:18080/fhir/`. Then start the WireGuard proxy and Vite together:

```sh
bun run dev:remote
```

Pressing `Ctrl+C` stops both processes. The proxy requires the remote HAPI
Machine to be running and port 18080 to be available locally.

The Compose stack builds the deployable HAPI image and starts it with a local
PostgreSQL database:

```sh
docker compose up --build hapi-fhir
```

The local-only datasource credentials and persistent Docker volume are defined
in `compose.yaml`.

## Fly deployment

The repository contains two Fly configurations:

- `fly.toml` deploys the public Practitioner UI and CDS Hooks API.
- `hapi/fly.toml` deploys HAPI without a public service, reachable by the UI at
  `practitioner-hapi-fhir.internal` over Fly's private network.

Provision PostgreSQL and deploy HAPI first, then deploy the root application in
the same Fly organization. See [`hapi/README.md`](hapi/README.md) for the exact
secret, deployment, and private verification commands.

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
