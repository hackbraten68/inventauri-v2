# Implementation Plan: Replace Supabase with PocketBase & Containerize Stack

**Branch**: `006-replace-supabase-pocketbase` | **Date**: 2025-11-24 | **Spec**: `/specs/006-replace-supabase-pocketbase/spec.md`
**Input**: Feature specification from `/specs/006-replace-supabase-pocketbase/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace Supabase with PocketBase as the authentication/authorization provider for the Astro + Prisma inventory app, ensuring all protected routes, APIs, and middleware rely on PocketBase tokens. Simultaneously deliver a Docker Compose workflow that runs PocketBase, the Astro server, and Postgres with proper secrets, health checks, and persistent volumes so developers can spin up the entire stack via `docker compose up`.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Astro 5.x on Node.js 20)  
**Primary Dependencies**: Astro, React islands, Prisma ORM, PocketBase JS/REST client, Docker Compose, Tailwind, Supabase (to be removed)  
**Storage**: PostgreSQL (Prisma-managed) for inventory data + PocketBase embedded DB for auth/users  
**Testing**: Vitest test suite (unit/contracts) + npm lint  
**Target Platform**: Node.js 20 SSR running locally/CI via Docker containers  
**Project Type**: Web application (single Astro project with server routes + React islands)  
**Performance Goals**: ≤300 ms p95 for PocketBase auth endpoints, ≤500 ms p95 for authenticated Astro API calls when running locally in Docker  
**Constraints**: Docker services default to ≤1 vCPU/1 GiB RAM each, localhost-only exposure, PocketBase + Postgres persisted via named volumes  
**Scale/Scope**: Design for ~100 shops, up to 20 staff each, 10 warehouses per shop (~2k items, ≤100k stock transactions per tenant)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Observation**: `.specify/memory/constitution.md` contains only placeholder headings/descriptions, so no enforceable principles or gates can be derived.  
- **Status**: NEEDS CLARIFICATION – Governance document must be populated before compliance can be evaluated. Proceeding while documenting the gap.
- **Post-Design Re-evaluation**: After completing research/design artifacts the constitution remains placeholder-only, so no additional gates can be applied until it is updated.

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

```text
src/
├── assets/
├── components/
├── layouts/
├── lib/
│   ├── api/
│   ├── auth/              # Supabase helpers to replace with PocketBase
│   ├── data/
│   ├── services/
│   ├── settings/
│   └── supabase-*.ts      # to be migrated to pocketbase equivalents
├── middleware.ts
├── pages/
│   ├── api/
│   ├── dashboard/
│   ├── inventory/
│   ├── items/
│   └── pos/
└── styles/

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

tests/
├── contracts/
└── vitest suites (unit/integration)

specs/
└── 006-replace-supabase-pocketbase/
    ├── spec.md
    ├── plan.md
    └── (Phase outputs: research.md, data-model.md, contracts/, quickstart.md)
```

**Structure Decision**: Single Astro/Prisma codebase; feature modifies auth libs, middleware, API routes, and adds Docker artifacts at repo root (`Dockerfile`, `docker-compose.yml`, `pocketbase/` config).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
