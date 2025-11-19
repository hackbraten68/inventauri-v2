# Contract Notes: Settings Versioning

No endpoint path changes are required. The `version` field in existing payloads now follows this contract:

- Accepts integer `0` when the resource does not exist for the tenant.
- Responds with HTTP 409 when the supplied version is less than or greater than the stored version after the initial record is created.
- Validation errors (HTTP 422) are returned for missing `version`, non-integer values, or negative numbers.
- Successful creates return the persisted record with `version` incremented to `1`; subsequent updates must submit that value.
