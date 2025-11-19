# Feature Specification: Allow Version Zero Creates

**Feature Branch**: `005-allow-version-zero`  
**Created**: 2025-10-22  
**Status**: Draft  
**Input**: User description: "Need to rework optimistic locking validation so brand-new shops can create their first business profile and operational preferences. Current ensureVersion rejects version = 0, but creation endpoints still expect clients to send zero before the record exists; validation now returns 422 and the 409 fallback rejects version = 1, blocking initial saves. Update validation (and any dependent logic/tests) to permit version = 0 on create while still enforcing positive versions on subsequent updates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Initial Business Profile (Priority: P1)

Shop owners setting up a new tenant fill in the business profile form and submit it once, expecting the record to be created successfully even though the client includes `version = 0` in the payload.

**Why this priority**: Without this path, onboarding stalls and the tenant cannot progress past the initial configuration screen.

**Independent Test**: Using a tenant without any business profile, submit the create/update business profile endpoint with `version = 0`; confirm a 200/201 response and that a follow-up fetch returns the stored profile with `version = 1`.

**Acceptance Scenarios**:

1. **Given** a tenant with no stored business profile, **When** the client submits `version = 0`, **Then** validation accepts the request and the profile is persisted with a new positive version value.
2. **Given** a tenant with an existing business profile at `version = 2`, **When** the client submits `version = 1`, **Then** the service rejects the request with the existing optimistic locking conflict response.

---

### User Story 2 - Create Initial Operational Preferences (Priority: P1)

Operations managers configure store preferences on first login and expect the initial save to succeed while still benefiting from version checks afterwards.

**Why this priority**: Operational workflows (POS defaults, notifications) depend on these settings; failure blocks store activation.

**Independent Test**: For a tenant lacking operational preferences, call the preferences endpoint with `version = 0`; confirm successful creation, then attempt an outdated `version` to verify conflicts still trigger.

**Acceptance Scenarios**:

1. **Given** a tenant without operational preferences, **When** the client submits `version = 0`, **Then** the record is created and the response echoes the incremented version.
2. **Given** an existing preferences record, **When** the client submits a payload with a stale version, **Then** the API returns the pre-existing conflict error structure.

---

### Edge Cases

- Requests omitting a `version` field entirely should continue to fail with validation guidance.
- Concurrent create attempts for the same tenant (multiple `version = 0` submissions) must result in exactly one success; late arrivals should surface the optimistic locking conflict response.
- Negative versions or non-integer values still trigger validation errors.
- Migration scripts or admin tools that already pass `version = 0` should keep working without code changes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The settings validation layer MUST accept `version = 0` when the associated record does not yet exist.
- **FR-002**: The validation layer MUST continue to reject negative versions, non-integer versions, and integers greater than zero when the stored record is absent (preventing clients from skipping the initial optimistic locking increment).
- **FR-003**: When a record exists, the optimistic locking guard MUST enforce that incoming versions match the stored version exactly and continue to return the current 409/conflict response on mismatches.
- **FR-004**: Unit and request tests MUST cover first-time creation flows for business profile and operational preferences, demonstrating that version zero passes validation and persists successfully.
- **FR-005**: API documentation or error messaging MUST clearly differentiate between “missing version” validation errors and “stale version” conflicts so integrators understand the required client behavior.

### Key Entities *(include if feature involves data)*

- **TenantSettingsVersion**: Conceptual representation capturing the stored version for business profile or operational preference records per tenant; fields include `tenantId`, `resourceType`, and `version`.
- **SettingsPayload**: Client-submitted structure containing `version`, `tenantId`, and domain-specific fields (business profile attributes or operational preferences).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: End-to-end integration tests confirm that submitting `version = 0` for a tenant with no settings returns HTTP 20x in 100% of runs across both business profile and operational preference endpoints.
- **SC-002**: Regression tests show that stale updates (submitting a version lower than the stored value) continue to return the conflict response in 100% of attempts.
- **SC-003**: QA smoke test covering new-tenant onboarding completes business profile and operational preferences setup without manual intervention in under 2 minutes.
- **SC-004**: Support ticket volume referencing “Cannot save settings on first attempt” drops to zero in the first sprint after release (baseline averaged >1 per sprint before the change).

## Assumptions

- Clients increment versions sequentially after receiving the current version from the service.
- Existing persistence logic automatically increments stored versions post-save; no additional work is needed to bump from zero to one.
- Both settings endpoints already share the validation helper being updated; no additional endpoints rely on the rejected behavior.
