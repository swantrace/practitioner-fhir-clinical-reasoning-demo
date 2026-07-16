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

The project and production image use Bun 1.3.14. Check `bun --version` and run
`bun upgrade` if the local version is older.

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

## CI/CD

The GitHub Actions workflow in `.github/workflows/ci-cd.yml` runs formatting,
type checking, tests, and a production build for every pull request targeting
`main`. A push to `main` deploys the Practitioner UI and runs smoke tests against
the public root and CDS discovery endpoints. The private HAPI app is deployed
first only when a file under `hapi/` changed; its Fly health check verifies
`/fhir/metadata` before the UI deployment can continue.

Create app-scoped Fly deploy tokens from each app directory and save them under
**GitHub repository settings → Secrets and variables → Actions**:

```sh
flyctl tokens create deploy -x 8760h -a practitioner-ui
# Save as FLY_API_TOKEN_UI

flyctl tokens create deploy -x 8760h -a practitioner-hapi-fhir
# Save as FLY_API_TOKEN_HAPI
```

Protect `main` with a GitHub branch ruleset that requires a pull request and the
`PR quality` status check, and disallow bypassing the rule. The deployment does
not install clinical artifacts, import fixtures, or reset production data;
those remain explicit administrative operations.

## Knowledge artifact

The source artifact is under
`clinical-artifacts/hypertension-bp-followup`. The checked-in FHIR Library
contains both CQL source and executable JSON ELM generated with the pinned
CQFramework translator. Java 17+ and Maven are needed only to regenerate it:

```sh
bun run clinical:compile
```

With `FHIR_BASE_URL` configured, install the knowledge artifacts, replace the
tagged fixture data, and verify all three `$apply` outcomes:

```sh
bun run demo:setup
```

The individual `demo:install`, `demo:reset`, and `demo:verify` commands are
idempotent and can also be run separately. The three scenarios are active
hypertension without blood pressure (applicable), active hypertension with
blood pressure (not applicable), and no hypertension (not applicable).

To verify the complete CDS Hooks boundary, keep the HonoX application running
and execute the CDS response verifier in another terminal:

```sh
bun run dev:remote
# In another terminal:
bun run demo:verify:cds
```

The verifier checks CDS discovery, sends three deterministic `patient-view`
requests, validates the Cards response shape, and confirms the expected card
count and warning content. To test a deployed application instead, override
`CDS_SERVICE_BASE_URL`; `CDS_BEARER_TOKEN` is supported when that endpoint is
protected.

## Closed-loop blood-pressure workflow

For the `hypertension-missing-bp` scenario, the warning Card includes a
**Record blood pressure** action. The practitioner can submit systolic and
diastolic values without leaving the patient chart. HonoX validates the values
and creates a FHIR R4 vital-signs Observation using:

- LOINC `85354-9` for the blood-pressure panel
- LOINC `8480-6` for systolic pressure
- LOINC `8462-4` for diastolic pressure
- UCUM `mm[Hg]` for both component quantities

After a successful FHIR create interaction, an HTMX event refreshes the Vital
Signs section and invokes the CDS Hooks service again. The newly stored
Observation makes the CQL condition false, so the warning Card disappears. The
Observation carries the demo dataset tag and is removed by `bun run demo:reset`.

## Synthea patient dataset

The three deterministic patients remain dedicated to the CDS acceptance
scenarios. Twelve additional Synthea transaction Bundles under
`fixtures/synthea/` provide a larger, realistic dataset for patient search and
chart browsing. Install and verify them separately:

```sh
bun run demo:synthea:install
bun run demo:synthea:verify
```

The importer validates each Bundle, preserves its transaction `fullUrl`
references, converts Synthea's POST requests to `PUT ResourceType/id`, and adds
the `synthea-12-v1` dataset tag to every resource. Re-running the importer
updates the same 6,925 clinical resources instead of creating duplicates. It
also installs 38 deterministic Practitioner, Organization, and Location
resources required by Synthea's conditional references. The normal `demo:reset`
command only restores the three CDS test patients and leaves the 12 Synthea
patients in place.

To install the knowledge artifacts, reset the three test scenarios, and import
all 12 Synthea patients in one operation, run:

```sh
bun run demo:seed:all
```

## Verification

```sh
bun run typecheck
bun test
bun run build
bun run demo:verify
```
