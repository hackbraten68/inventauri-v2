# Research Findings: Allow Version Zero Creates

## Decision: Permit version zero on create
- **Decision**: Validation will allow `version = 0` when no existing record is present.
- **Rationale**: Unblocks initial creation flows while preserving optimistic locking semantics on subsequent updates.
- **Alternatives considered**:
  - Forcing clients to omit the version field entirely — rejected because existing clients already send the field and expect explicit versioning.
  - Auto-incrementing any non-positive version server-side — rejected to avoid hiding client bugs and to keep conflict messaging consistent.
