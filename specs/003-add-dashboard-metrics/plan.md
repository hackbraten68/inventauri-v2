# Implementation Plan: Dashboard Operational Metrics

**Branch**: `003-add-dashboard-metrics` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-add-dashboard-metrics/spec.md`

## Summary

Extend the existing Astro-based operations dashboard with three actionable insights: sales trend deltas against the prior period, days-of-cover calculations for items already flagged as low-stock, and inbound purchase order coverage per warning. Delivery will augment the dashboard API and UI layers while reusing the established Prisma queries and layout primitives, with lightweight badges and inline copy to maintain current page simplicity.

## Technical Context

**Language/Version**: TypeScript (Astro 5 on Node.js 20.x runtime)  
**Primary Dependencies**: Astro UI runtime, React components, Prisma Client, date-fns, Tailwind UI primitives  
**Storage**: PostgreSQL accessed through Prisma ORM  
**Testing**: Vitest (unit, integration, and contract suites)  
**Target Platform**: Server-rendered web dashboard (Astro SSR + static hydration)  
**Project Type**: Web monorepo with shared frontend + server utilities  
**Performance Goals**: Dashboard API responses ≤ 400 ms p95 for 30-day ranges with ≤ 10k transactions; UI renders without layout shifts under typical operator workloads  
**Constraints**: Reuse existing Prisma data fetches where possible, preserve current card grid layout, expose new metrics via API for automated assertions, no heavy visualization libs  
**Scale/Scope**: Single-tenant shop contexts with up to 5k active SKUs, daily operator usage by small teams (<50 concurrent users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Initial Review**: `.specify/memory/constitution.md` only contains placeholder headings, so no enforceable principles are available. Proceeding under default engineering practices while flagging the missing governance content.
- **Post-Design Review**: No new constraints introduced; governance file still requires population. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-dashboard-metrics/
├── plan.md          # Implementation plan (this file)
├── research.md      # Phase 0 findings (generated in this run)
├── data-model.md    # Phase 1 entity design
├── quickstart.md    # Phase 1 onboarding notes
├── contracts/       # Phase 1 API/schema contracts
└── spec.md          # Approved feature specification
```

### Source Code (repository root)

```text
src/
├── components/           # React/Astro UI components (dashboard cards live here)
├── lib/
│   ├── api/              # Response helpers
│   ├── auth/             # Authentication utilities
│   ├── data/             # Prisma-powered data access (dashboard snapshot module)
│   ├── prisma.ts         # Prisma client singleton
│   ├── services/         # Domain services
│   └── tenant.ts         # Shop scoping helpers
├── layouts/              # App layout shells
├── pages/                # Astro pages, including /dashboard and /api/dashboard
├── middleware.ts         # Route protection
└── styles/               # Global styles and Tailwind directives

tests/
├── contracts/            # API contract tests
├── integration/          # Cross-module integration tests
├── performance/          # Performance and regression baselines
└── unit/                 # Unit tests for utilities/components
```

**Structure Decision**: Retain the single Astro project layout above, enhancing `src/lib/data/dashboard.ts`, `src/components/dashboard/` widgets, and associated tests without introducing new top-level packages.

## Complexity Tracking

No constitution violations identified; section intentionally left empty.
