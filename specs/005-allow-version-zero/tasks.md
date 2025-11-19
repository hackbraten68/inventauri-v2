# Tasks: Allow Version Zero Creates

**Input**: Design documents from `/specs/005-allow-version-zero/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required for this feature — spec mandates unit and request coverage for first-time creation flows.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Confirm local Prisma schema is up to date via `npm run db:generate`
- [x] T002 Seed a clean tenant without business profile or operational preferences using `npm run db:seed`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Audit existing optimistic locking helpers in `src/lib/settings/validation.ts` and note current version checks
- [x] T004 Identify integration tests touching settings versioning under `tests/integration/settings/` for later updates

---

## Phase 3: User Story 1 - Create Initial Business Profile (Priority: P1) 🎯 MVP

**Goal**: Allow initial business profile save with `version = 0` while keeping optimistic locking for existing records.

**Independent Test**: Hit business profile endpoint with version 0 for a fresh tenant and confirm success; repeat with stale version to confirm conflict.

### Tests

- [x] T005 [US1] Add unit coverage for `ensureVersion` behavior around `version = 0` in `tests/unit/settings-version.test.ts`
- [x] T006 [US1] Extend business profile request/integration test to cover first-save + stale-version cases in `tests/integration/settings-business-profile.test.ts`
- [x] T018 [US1] Add concurrent version-zero create test ensuring one success/one conflict in `tests/integration/settings-business-profile.test.ts`

### Implementation

- [x] T007 [US1] Update `ensureVersion` logic to accept zero only when no stored record exists in `src/lib/settings/validation.ts`
- [x] T008 [US1] Adjust business profile handler to surface clarified validation/conflict messages in `src/lib/settings/validation.ts`
- [x] T009 [US1] Update API documentation or error mapper strings reflecting new guidance in `src/lib/settings/validation.ts`

**Checkpoint**: Business profile first-save works; stale versions still conflict.

---

## Phase 4: User Story 2 - Create Initial Operational Preferences (Priority: P1)

**Goal**: Ensure operational preferences share the permissive create logic and conflict handling parity.

**Independent Test**: Perform first-save on operational preferences with `version = 0` and verify success; stale submissions must conflict.

### Tests

- [x] T010 [US2] Add matching unit cases covering operational preference paths in `tests/unit/settings-version.test.ts`
- [x] T011 [US2] Extend operational preferences integration tests with create + conflict scenarios in `tests/integration/settings-operational-preferences.test.ts`

### Implementation

- [x] T012 [US2] Apply version-zero allowance to operational preferences code paths in `src/pages/api/settings/operational.ts`
- [x] T013 [US2] Ensure shared validation helper is invoked consistently for operational preferences in `src/lib/settings/validation.ts`
- [x] T014 [US2] Align any client-facing copy or API docs for preferences in `src/lib/settings/validation.ts`

**Checkpoint**: Operational preferences mirror business profile behavior.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T015 Update quickstart instructions with targeted test commands in `specs/005-allow-version-zero/quickstart.md`
- [x] T016 Add release note entry highlighting version-zero support in `ROADMAP.md`
- [x] T017 [P] Run full regression suite `npm test` and capture results in `tests/RESULTS.md`

---

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 (Phase 4) → Polish (Phase 5)
- Within each story, run tests (T005/T006, T010/T011) before corresponding implementation tasks to honor TDD expectations.
- Operational preferences (US2) depends on shared helper updates from US1.

---

## Parallel Opportunities

- T005 and T006 can run in parallel once foundational analysis (T003/T004) completes.
- During US2, T010 and T011 may proceed concurrently with T012/T013 after helper adjustments land.
- Polish tasks T015–T017 can execute once both stories pass validation.

---

## Implementation Strategy

- Deliver MVP by completing US1 first; deploy fix for business profile creation as soon as tests pass.
- Follow with US2 adjustments to keep both settings sections aligned.
- Finish with documentation updates and regression run to ensure stability.
