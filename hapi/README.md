# HAPI FHIR

HAPI FHIR is the FHIR repository and Clinical Reasoning runtime for this demo.
The HonoX application owns the CDS Hooks HTTP API, so HAPI's native CDS Hooks
module remains disabled.

Required production configuration:

- FHIR R4
- Clinical Reasoning enabled
- persistent PostgreSQL datasource
- network access restricted to the HonoX backend or protected by authentication

The checked-in configuration uses H2 only as a local convenience. Fly.io must
provide `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
`SPRING_DATASOURCE_PASSWORD` for PostgreSQL.
