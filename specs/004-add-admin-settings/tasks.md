# Tasks: Basic Admin Settings

**Input**: Design documents from `/specs/004-add-admin-settings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Contract and integration tests are included where they meaningfully de-risk behaviour. They may be skipped only with explicit stakeholder approval.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish entry points and shell views required by every settings story.

- [X] T001 Update admin navigation to link the new settings workspace in `src/components/layout/SidebarSettings.tsx`.
- [X] T002 Scaffold authenticated settings shell with tab placeholders in `src/pages/settings/index.astro`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [X] T003 Extend `prisma/schema.prisma` with BusinessProfile, OperationalPreference, NotificationPreference, NotificationRecipient, StaffInvitation, SettingsAuditLog, and UserShop status fields.
- [X] T004 Generate Prisma migration and seed defaults for existing shops in `prisma/migrations/*` and `prisma/seed.ts`.
- [X] T005 Add shared settings validation and version helpers in `src/lib/settings/validation.ts`.
- [X] T006 Implement audit logging utility that writes SettingsAuditLog entries in `src/lib/data/settings/audit.ts`.
- [X] T007 Add owner/manager guard helpers for settings APIs in `src/lib/api/settings/guard.ts`.
- [X] T008 Seed default settings records for tests in `tests/setup.ts` to keep suites deterministic.

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Maintain Business Profile (Priority: P1) 🎯 MVP

**Goal**: Allow admins to view and update business identity/contact data with validations, concurrency safety, and audit trails.

**Independent Test**: Update the legal name and contact fields via UI, confirm the API responds with new version, and verify downstream screens display the refreshed information without touching other settings.

### Tests for User Story 1

- [X] T009 [P] [US1] Add failing contract tests for GET/PUT `/api/settings/business-profile` in `tests/contracts/settings.business-profile.test.ts`.
- [X] T010 [P] [US1] Add integration test covering business profile edit/save flow in `tests/integration/settings-business-profile.test.ts`.

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement BusinessProfile repository with optimistic concurrency and audit writes in `src/lib/data/settings/business-profile.ts`.
- [X] T012 [US1] Implement guarded GET/PUT handler using validation + concurrency checks in `src/pages/api/settings/business-profile.ts`.
- [X] T013 [P] [US1] Build React form with dirty tracking, field validation, and unsaved-change prompts in `src/components/settings/BusinessProfileForm.tsx`.
- [X] T014 [US1] Integrate business profile form, success/error toasts, and version conflict messaging in `src/pages/settings/index.astro`.
- [X] T015 [US1] Expose business profile view model for downstream consumers in `src/lib/settings/view-model.ts` and refresh usages in `src/pages/dashboard/index.astro`.

**Checkpoint**: Business profile management functional and independently testable.

---

## Phase 4: User Story 2 - Configure Operational Preferences (Priority: P2)

**Goal**: Enable per-tenant control of currency, timezone, units, and notification toggles with quick propagation to reports and alerts.

**Independent Test**: Change default currency and timezone, refresh reports to see new defaults, toggle notifications, and confirm recipients receive updated configuration while business profile remains untouched.

### Tests for User Story 2

- [X] T016 [P] [US2] Add contract tests for `/api/settings/operational` and `/api/settings/notifications` endpoints in `tests/contracts/settings.operational.test.ts`.
- [X] T017 [P] [US2] Add integration test validating timezone/currency/notification changes in `tests/integration/settings-operational.test.ts`.

### Implementation for User Story 2

- [X] T018 [P] [US2] Implement OperationalPreference repository with version bumping in `src/lib/data/settings/operational.ts`.
- [X] T019 [P] [US2] Implement NotificationPreference + NotificationRecipient repository with constraint checks in `src/lib/data/settings/notifications.ts`.
- [X] T020 [US2] Implement guarded GET/PUT handler for operational defaults in `src/pages/api/settings/operational.ts`.
- [X] T021 [US2] Implement notification settings routes (list, bulk patch, recipient add/remove) in `src/pages/api/settings/notifications/index.ts` and `src/pages/api/settings/notifications/[preferenceId]/recipients.ts`.
- [X] T022 [P] [US2] Build operational preferences form with timezone and unit selectors in `src/components/settings/OperationalPreferencesForm.tsx`.
- [X] T023 [P] [US2] Build notification preferences panel with recipient management in `src/components/settings/NotificationPreferencesPanel.tsx`.
- [X] T024 [US2] Integrate operational + notification panels with API wiring and optimistic UI in `src/pages/settings/index.astro`.
- [X] T025 [US2] Implement propagation helpers to refresh reports/exports within 60s in `src/lib/services/settings/propagate.ts` and invoke from operational + notification handlers.

**Checkpoint**: Operational defaults and notifications configurable independent of other stories.

---

## Phase 5: User Story 3 - Control Staff Access (Priority: P3)

**Goal**: Provide invitation, role assignment, and deactivation tools that sync with Supabase auth and log every change.

**Independent Test**: Invite a staff member, accept via test harness, change their role, deactivate them, and confirm access revocation plus audit log capture while US1/US2 features remain stable.

### Tests for User Story 3

- [X] T026 [P] [US3] Add contract tests for staff list/invite/update endpoints in `tests/contracts/settings.staff.test.ts`.
- [X] T027 [P] [US3] Add integration test covering invite → accept → deactivate journey in `tests/integration/settings-staff.test.ts`.

### Implementation for User Story 3

- [X] T028 [P] [US3] Implement staff repository handling invitations, status updates, and audit writes in `src/lib/data/settings/staff.ts`.
- [X] T029 [US3] Implement staff management API routes (list, invite, revoke/resend, update) in `src/pages/api/settings/staff/index.ts` and `src/pages/api/settings/staff/invitations.ts`.
- [X] T030 [P] [US3] Create Supabase admin wrapper for invites/deactivation in `src/lib/services/settings/staff-admin.ts`.
- [X] T031 [P] [US3] Build staff management panel with role controls and deactivate flows in `src/components/settings/StaffManagementPanel.tsx`.
- [X] T032 [US3] Integrate staff management UI and audit log triggers into `src/pages/settings/index.astro`.

**Checkpoint**: Access control tooling complete and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements spanning multiple stories that solidify usability, observability, and documentation.

- [X] T033 [P] Add reusable audit log viewer and surface it within settings in `src/components/settings/AuditLogPanel.tsx` and `src/pages/settings/index.astro`.
- [X] T034 [P] Update feature quickstart with verification steps for all settings flows in `specs/004-add-admin-settings/quickstart.md`.
- [X] T035 Refresh environment docs to highlight required Supabase keys in `.env.example` and `README.md`.

---

## Dependencies & Execution Order

1. **Phase 1 → Phase 2**: Navigation shell (Phase 1) must exist before foundational work exposes APIs.
2. **Phase 2 → Stories**: Schema, validation, audit, guards, and seeded data (Phase 2) block all user stories.
3. **User Story Order**: US1 (P1) delivers MVP. US2 and US3 can start after Phase 2 but should coordinate with US1 for shared UI sections.
4. **Polish**: Runs after primary stories so the audit viewer and docs reflect final behaviour.

---

## Parallel Execution Examples

- **US1**: While T011 builds the repository, T013 can create the form component and T009 prepares contract tests.
- **US2**: T018 (repository) and T019 (notification repo) can proceed concurrently, followed by parallel UI work (T022, T023).
- **US3**: T028 (repository) and T030 (Supabase wrapper) can run in parallel before integrating via T029 and T031.
- **Cross-Story**: After Phase 2, US2 and US3 teams can progress simultaneously because their APIs and components touch distinct modules.

---

## Implementation Strategy

1. **MVP First**: Complete US1 to unlock business profile editing and validate audit logging + version control end-to-end.
2. **Expand Configuration**: Layer operational defaults (US2) next to satisfy reporting accuracy and notification toggles without disturbing US1.
3. **Access Control**: Deliver staff management (US3) once the workspace is stable, ensuring Supabase integration and audit histories.
4. **Hardening**: Finish with polish tasks (audit viewer, docs, env guidance) to support rollout and future maintenance.
