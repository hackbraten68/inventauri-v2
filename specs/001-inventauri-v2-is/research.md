# Research (Phase 0)

## Decisions and Rationale

- Decision: Multi-tenant (multiple shops per instance)
  - Rationale: Supports hosting for multiple micro-shops while reducing operational overhead.
  - Alternatives: Single-tenant only (simpler) rejected to meet multi-client goal.

- Decision: Roles = Owner, Manager, Staff; Auth = Email/password
  - Rationale: Clear responsibilities; low friction auth for self-hosted setups.
  - Alternatives: Magic links/SSO deferred to reduce initial complexity.

- Decision: Variants as distinct SKUs under a parent product; fixed unit per variant
  - Rationale: Real-world retail needs per-variant stock/pricing/alerts; predictable unit semantics.
  - Alternatives: Attribute-only variants rejected due to auditability and SKU operational needs.

- Decision: Offline read-only; sales require online connection
  - Rationale: Simplifies concurrency and conflict handling for v1; fits Supabase online model.
  - Alternatives: Full offline sales with sync deferred.

- Decision: Reporting scope (v1) = basic sales totals and trends (daily/weekly/monthly)
  - Rationale: Provides immediate insights while keeping footprint small.
  - Deferred: Top sellers/low-stock, returns/discounts, tax breakdown, staff/customer analytics.

- Decision: Tech stack = Astro + TypeScript frontend; Supabase (Postgres + Auth + Policies) backend in Docker
  - Rationale: Fast setup, strong DX, managed policies for multi-tenant isolation, self-hostable.

## Constraints and Performance Targets

- POS commit < 250 ms on local network path; dashboard hydrate < 1 s with cached summaries.
- Up to 10,000 products per tenant.
- Read-only experience while offline (catalog and stock views).

## Open Risks & Mitigations

- Risk: Multi-tenant row-level security complexity
  - Mitigation: Early RLS policy design + contract tests for tenant isolation.
- Risk: Variant modeling migrations later
  - Mitigation: Immutable unit per variant post-transaction; migrations toolchain.
- Risk: Self-hosting for non-tech users
  - Mitigation: Provide `quickstart.md` with Docker steps; future one-click installer.

## Alternatives Considered

- Single-tenant only for v1: simpler, but conflicts with multi-client goal.
- Full offline-first: valuable but high complexity; postponed to v2.

## Outcome

All critical unknowns for v1 scope are resolved; proceed to Phase 1 design & contracts.
