# Private HAPI FHIR Service

This directory is a deployable HAPI FHIR R4 Clinical Reasoning service for the
demo. HAPI owns FHIR persistence and CQL execution. The HonoX application owns
the practitioner UI and the CDS Hooks HTTP boundary, so HAPI's native CDS Hooks
module remains disabled.

## What is included

- the official, fixed `hapiproject/hapi:v8.10.0-2` image
- FHIR R4 and HAPI Clinical Reasoning
- a required PostgreSQL datasource (no production fallback to H2)
- a Fly health check at `/fhir/metadata`
- a 2 GB shared-CPU Fly Machine
- no public Fly HTTP service

Because `fly.toml` intentionally contains neither `[http_service]` nor
`[[services]]`, HAPI is not exposed through a public Fly address. Applications
in the same Fly organization can reach it over 6PN at:

```text
http://practitioner-hapi-fhir.internal:8080/fhir/
```

Private networking is the MVP security boundary, not application-level
authentication. HAPI Starter does not enable authentication by default, so
other workloads and members with access to the Fly organization must be
trusted.

## Local development

From the repository root, start PostgreSQL and HAPI using the same custom image
that is deployed to Fly:

```sh
docker compose up --build hapi-fhir
```

If port 8080 is already occupied, select another host port (the container still
listens on 8080):

```sh
HAPI_PORT=18080 docker compose up --build hapi-fhir
```

Wait for HAPI to finish its first database migration, then verify it:

```sh
curl --fail http://localhost:8080/fhir/metadata
```

The credentials in `compose.yaml` are intentionally local-only. PostgreSQL data
is retained in the `hapi-postgres-data` Docker volume.

## Fly deployment

The HAPI app and the Practitioner UI app must belong to the same Fly
organization. Fly app names are globally unique, so if you change
`practitioner-hapi-fhir` in this directory's `fly.toml`, make the same change to
`FHIR_BASE_URL` in the repository root `fly.toml`.

1. Provision a persistent PostgreSQL database. Fly Managed Postgres or another
   PostgreSQL provider reachable from the HAPI Machine can be used.

2. Create the private app in the same organization as the UI:

   ```sh
   cd hapi
   fly apps create practitioner-hapi-fhir --org YOUR_ORGANIZATION
   ```

3. Store the database credentials as Fly secrets. The JDBC URL must match the
   hostname, database, port, and TLS requirements provided by the database:

   ```sh
   fly secrets set \
     SPRING_DATASOURCE_URL='jdbc:postgresql://DB_HOST:5432/DB_NAME?sslmode=require' \
     SPRING_DATASOURCE_USERNAME='DB_USER' \
     SPRING_DATASOURCE_PASSWORD='DB_PASSWORD'
   ```

4. Deploy from this directory:

   ```sh
   fly deploy
   fly checks list
   ```

The three datasource variables are required. Do not place real credentials in
`fly.toml`, `application.yaml`, or Git.

## Verify a private deployment

The absence of a public service is intentional. To inspect HAPI from your local
machine, open a temporary authenticated Fly proxy:

```sh
fly proxy 8080:8080 -a practitioner-hapi-fhir
```

In another terminal:

```sh
curl --fail http://localhost:8080/fhir/metadata
```

Stop the proxy when verification is complete. Deploy the root Practitioner UI
app to the same organization; its checked-in `FHIR_BASE_URL` already points at
the private `.internal` hostname.

## Clinical artifacts

The server starts without the demo's knowledge artifacts or sample patients.
Translate the CQL to ELM and install the Library, PlanDefinition, and seed FHIR
resources after deployment. Those repeatable seed/reset operations are a
separate application workflow and should call HAPI only from the HonoX backend,
not expose HAPI administration to the browser.
