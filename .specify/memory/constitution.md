<!--
Sync Impact Report
Version: 0.0.0 -> 1.0.0
Principles: placeholders -> I. Test-First Delivery (TFD), II. Single CLI Surface, III. Full Containerization, IV. Tenant-Safe Access, V. Observable Operations
Added Sections: Operational Constraints, Development Workflow & Quality Gates
Removed Sections: None
Templates:
  - .specify/templates/plan-template.md ✅ still compatible; reiterates Constitution Check
  - .specify/templates/spec-template.md ✅ already enforces prioritized stories/tests
  - .specify/templates/tasks-template.md ✅ mandates story grouping and optional tests
  - .specify/templates/commands/ ⚠ directory missing; create command docs referencing CLI/container workflow when available
Runtime Guidance:
  - README.md ✅ already instructs Docker Compose + npm scripts; no edits needed
Follow-ups:
  - TODO(COMMAND_TEMPLATES): Populate `.specify/templates/commands/*.md` so command docs can cite Constitution gates.
-->

# Inventauri v2 Constitution

## Core Principles

### I. Test-First Delivery (TFD)
- All work follows `spec → plan → tasks → tests → implementation`. Skipping a stage or blending outputs is prohibited.
- Each user story requires at least one failing automated test (unit, contract, or integration) before writing production code; regression must pass via `npm test && npm run lint`.
- Code reviewers MUST reject changes without evidence of failing-then-passing tests or an approved rationale for test deferral (documented in tasks.md).

### II. Single CLI Surface
- Every workflow is exposed through `npm` scripts or `/speckit.*` commands. Manual shell snippets in docs are forbidden unless wrapped in a script.
- Scripts MUST provide text I/O (stdout for results, stderr for errors) so they can be chained in CI and the Codex CLI.
- README, quickstart, and tasks must reference the exact CLI commands; undocumented flags or hidden steps violate this principle.

### III. Full Containerization
- The entire stack (PocketBase, Astro app, Postgres, supporting services) MUST run via Docker Compose; contributions that only work locally are rejected.
- Compose files MUST declare health checks, named volumes, and `.env.docker` support so environments survive restarts.
- Any new dependency requires an accompanying container/service definition or explicit justification recorded in plan.md under Constraints.

### IV. Tenant-Safe Access
- Auth, middleware, and APIs MUST prove tenant isolation via automated tests or contract checks before merging.
- Shared utilities (`src/lib/*`) must accept tenant context explicitly; implicit globals are disallowed.
- Data migrations or imports MUST include rollback notes covering tenant-specific failures.

### V. Observable Operations
- Features MUST emit structured logs for auth, inventory actions, and container health transitions; `console.log` debugging is insufficient.
- Monitoring hooks (health endpoints, Docker health checks, `verify:*` scripts) MUST fail fast when services degrade.
- Success criteria in spec.md require measurable metrics (latency, error rates) with tasks tied to each measurement.

## Operational Constraints

- Minimum toolchain: Node.js 20, npm 10, Docker 24+, docker-compose v2, PostgreSQL 15 client.
- Required verification command: `npm test && npm run lint` (native) or `npm run verify:pocketbase` (Docker) before opening a PR.
- Secrets live only in `.env.local`/`.env.docker`; never hard-code or commit credentials. Rotate by updating `.env.*` templates plus Compose files.
- Documentation MUST specify both native CLI and Docker invocation if the workflow differs.

## Development Workflow & Quality Gates

1. **Specify** via `/speckit.specify` to refresh `spec.md`. Constitution gate: reject drafts missing prioritized stories, requirements, or success criteria.
2. **Plan** via `/speckit.plan`. Constitution gate: confirm Full Containerization and Single CLI Surface decisions are reflected in the architecture/stack sections.
3. **Tasks** via `/speckit.tasks`. Constitution gate: trace each requirement to at least one task and flag missing test coverage.
4. **Analyze** via `/speckit.analyze` prior to implementation; blockers (constitution, coverage, ambiguity) MUST be resolved before `/speckit.implement`.
5. **Implement** only after failing tests exist. Every PR MUST include proof of `npm test && npm run lint` (or `npm run verify:pocketbase`) and Compose health checks.
6. **Review**: reviewers verify adherence to all principles plus Operational Constraints; violations require rework or a documented constitution amendment.

## Governance

- The constitution supersedes other guidance. Breaking a principle requires a temporary exemption recorded in plan.md’s Complexity Tracking plus a follow-up amendment.
- Amendments follow semantic versioning: MAJOR for redefining/removing principles, MINOR for adding principles/sections, PATCH for wording clarifications. Current change: new constitution → v1.0.0.
- Ratification requires approval from feature owner(s) and lead maintainer; record ratification and amendment dates in this document.
- Compliance reviews occur before `/speckit.plan`, before `/speckit.tasks`, and during PR review. Any skipped gate halts delivery until resolved.
- Store past versions in git history; reopening the constitution demands documenting rationale in the PR/commit message.

**Version**: 1.0.0 | **Ratified**: 2025-12-08 | **Last Amended**: 2025-12-08
