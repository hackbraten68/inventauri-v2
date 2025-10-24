# Implementation Plan: Basic Admin Settings

**Branch**: `004-add-admin-settings` | **Date**: 2025-10-23 | **Spec**: [/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/spec.md](/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/spec.md)
**Input**: Feature specification from `/specs/004-add-admin-settings/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver an admin-facing settings workspace that lets Owners/Admins maintain the business profile, configure operational defaults (currency, timezone, units, fiscal calendar), manage notification preferences, and control staff access. Implementation will extend the existing Astro + Supabase stack: persistence through Prisma models mapped to Supabase Postgres, UI delivered via Astro islands with shared React components, and audit logging routed through the existing activity log patterns.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Astro 5.x on Node 20 LTS)  
**Primary Dependencies**: Astro + React islands, Prisma ORM, Supabase JS SDK, Tailwind design system  
**Storage**: Supabase Postgres accessed via Prisma client  
**Testing**: Vitest (unit, integration, contract suites) with existing `tests/contracts` harness  
**Target Platform**: Web application delivered via Astro Node adapter (SSR + islands)  
**Project Type**: Web application (single project with Astro front end and server adapters)  
**Performance Goals**: Settings changes reflect across surfaces within 60 seconds 95% of the time; admin workflows complete within 2 minutes in usability tests  
**Constraints**: Role-restricted access, auditability of configuration changes, guard against concurrent edit conflicts  
**Scale/Scope**: Multi-user micro-shop accounts (≈1–20 staff per tenant) sharing a single business entity

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The constitution file contains placeholder headings with no enforceable principles, constraints, or workflow mandates. No explicit gates are defined, so this plan proceeds under default project practices.
- Post-Phase-1 check: No new governance rules were introduced during design; gate remains clear.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── components/
├── layouts/
├── lib/
├── pages/
├── styles/
├── assets/
└── middleware.ts

tests/
├── contracts/
├── integration/
├── performance/
├── unit/
├── setup.ts
└── util.ts
```

**Structure Decision**: Extend the existing single Astro project within `src/`, adding settings-related pages, components, and lib modules; place supporting tests inside the established `tests/{unit,integration,contracts}` directories.

## Phase 0 — Research Summary

- Validated the need for dedicated Prisma models per settings domain to maintain tenant isolation and manageable validation.
- Confirmed new `SettingsAuditLog` table is required to satisfy audit obligations separate from inventory transactions.
- Established Supabase-admin driven invitation + deactivation flow to keep authentication centralized.
- Selected optimistic concurrency (version + updatedAt) to surface conflicting edits to administrators.

## Phase 1 — Design Snapshot

- Data model blueprint captured in `data-model.md` covering new tables (BusinessProfile, OperationalPreference, NotificationPreference, StaffInvitation, SettingsAuditLog) and updates to `UserShop`.
- REST contract (`contracts/settings.openapi.yaml`) defines endpoints for profile, operational defaults, notifications, staff lifecycle, and audit log access with role-based behaviors.
- Quickstart guide (`quickstart.md`) outlines environment setup, migrations, and verification commands for the settings module.

## Deliverables

- `/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/research.md`
- `/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/data-model.md`
- `/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/contracts/settings.openapi.yaml`
- `/home/sam/Documents/GitHub/inventauri-v2/specs/004-add-admin-settings/quickstart.md`

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
