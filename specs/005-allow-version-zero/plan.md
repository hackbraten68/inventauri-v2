# Implementation Plan: Allow Version Zero Creates

**Branch**: `005-allow-version-zero` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/005-allow-version-zero/spec.md`

## Summary

Restore first-time saves for tenant settings by allowing `version = 0` through validation while preserving optimistic locking for updates. The change will adjust shared validation helpers, update error messaging, and expand automated tests covering both business profiles and operational preferences. See [research.md](./research.md) for assumptions.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 runtime)  
**Primary Dependencies**: Astro server routes, Prisma ORM, Supabase-authenticated API handlers, internal validation utilities  
**Storage**: PostgreSQL (Prisma-managed tenant settings tables)  
**Testing**: Vitest unit + integration suites  
**Target Platform**: Backend API endpoints consumed by web clients  
**Project Type**: Single web project (Astro + API routes)  
**Performance Goals**: Must keep settings endpoints within existing latency budgets; no additional goals introduced  
**Constraints**: Maintain backward compatibility for clients already using versioned requests; validation changes must be localized to shared helper  
**Scale/Scope**: Applies to all tenants; expected to run on every create/update request but with negligible overhead

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The project constitution file is still a placeholder with no enforceable principles. Proceed under established engineering norms; no gates triggered.
- Post-design check: No new principles introduced; validation change remains within existing governance expectations.

## Project Structure

### Documentation (this feature)

```text
specs/005-allow-version-zero/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md  # created by /speckit.tasks later
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── settings/
│   ├── api/
│   └── prisma.ts
├── pages/
└── middleware.ts

tests/
├── unit/
├── integration/
└── contracts/
```

**Structure Decision**: Work within the existing single-project layout, focusing on validation utilities under `src/lib/settings/` and the related test suites under `tests/unit` and `tests/integration`.

## Complexity Tracking

No constitution violations identified.
