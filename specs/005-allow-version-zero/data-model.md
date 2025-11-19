# Data Model: Allow Version Zero Creates

## TenantSettingsVersion (conceptual)
- **tenantId** (string/UUID) — identifier for the tenant owning the settings record.
- **resourceType** (enum: `businessProfile`, `operationalPreferences`) — distinguishes which settings table/version applies.
- **version** (integer) — current stored version; increments monotonically starting from 1 after initial insert.

## SettingsPayload (request contract)
- **version** (integer) — client-supplied version.
- **data** (object) — domain-specific payload (business profile fields or operational preferences).

## Validation Rules
- When no record exists, accept `version = 0`; reject negative or non-integer values.
- When a record exists, require equality between provided version and stored version.
- After successful persistence, increment stored version by 1 and return new value in response.
