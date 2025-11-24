# Tasks: Replace Supabase with PocketBase & Containerize Stack

**Input**: Design documents from `/specs/006-replace-supabase-pocketbase/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested; tasks emphasize functional delivery. Add tests opportunistically when they de-risk a story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare environment scaffolding and configuration placeholders required across all stories.

- [X] T001 Update PocketBase environment placeholders in `.env.example` (root) for admin email/password, public URL, and service API tokens.
- [X] T002 Extend `src/env.d.ts` so Astro’s type-safe env access exposes the new `PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, and related secrets.
- [X] T003 Create `.env.docker.example` at repo root containing Compose-ready defaults for Postgres, PocketBase, and the Astro app.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST exist before implementing any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Update `package.json` and `package-lock.json` to add the `pocketbase` JS SDK dependency and remove unused Supabase packages.
- [X] T005 Create `src/lib/pocketbase-client.ts` (browser client wrapper) and remove `src/lib/supabase-client.ts`, updating exports so components can import the new helper.
- [X] T006 Add `src/lib/pocketbase-admin.ts` to initialize the server-side PocketBase admin client using service role credentials.
- [X] T007 Implement shared token utilities in `src/lib/auth/pocketbase-session.ts` (parse cookies, refresh tokens, fetch PocketBase profiles) for use by middleware, SessionGuard, and API routes.

**Checkpoint**: Foundation ready—user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 – PocketBase Sign-in Flow (Priority: P1) 🎯 MVP

**Goal**: Staff can sign in via PocketBase, receive secure session cookies, and navigate protected Astro pages without Supabase.

**Independent Test**: Start the dev server, create a PocketBase user, log in via `/login`, verify cookies `pb-access-token`/`pb-refresh-token` are set, refresh the page to ensure `SessionGuard` keeps the session alive, then log out and confirm redirect to `/login`.

### Implementation for User Story 1

- [X] T008 [US1] Update `src/lib/auth/cookies.ts` to write/delete the new `pb-access-token` and `pb-refresh-token` cookies with HttpOnly/SameSite attributes.
- [X] T009 [US1] Refactor `src/components/auth/LoginForm.tsx` to post to `/api/auth/login`, handle PocketBase errors, and reflect the new provider in button/copy.
- [X] T010 [US1] Refresh the messaging in `src/pages/login.astro` to describe PocketBase authentication and remove Supabase-specific text.
- [X] T011 [P] [US1] Implement `/src/pages/api/auth/login.ts` to call the PocketBase Admin API, verify credentials, and return user/profile data with cookies set.
- [X] T012 [P] [US1] Implement `/src/pages/api/auth/logout.ts` to revoke the PocketBase session and clear both cookies.
- [X] T013 [P] [US1] Implement `/src/pages/api/auth/session.ts` to validate existing cookies, refresh tokens when needed, and return the user profile.
- [X] T014 [US1] Rewrite `src/components/auth/SessionGuard.tsx` to call the new session endpoint, sync cookies, and redirect to `/login` when the PocketBase session disappears.
- [X] T015 [US1] Update `src/middleware.ts` to rely on `pb-access-token`, redirect unauthenticated users, and skip Supabase-only exclusions.

**Checkpoint**: PocketBase login works end-to-end; protected Astro pages require the new cookies.

---

## Phase 4: User Story 2 – API Authorization via PocketBase (Priority: P2)

**Goal**: All API routes and server-rendered inventory pages validate PocketBase tokens, enforce tenant membership, and only operate on the caller’s shop data.

**Independent Test**: Acquire tokens for two PocketBase users tied to different shops. Use them to hit `/api/items`, `/api/stock/transfer`, `/dashboard`, and `/inventory`. Confirm the authorized tenant succeeds while the unauthorized tenant receives 403 responses or empty data, and verify SSR pages no longer show other shops’ stock.

### Implementation for User Story 2

- [X] T016 [US2] Replace Supabase logic inside `src/lib/auth/server.ts` with PocketBase verification using the helpers from `pocketbase-session.ts`, ensuring returned structs include `shopId`/`role`.
- [X] T017 [US2] Update `src/lib/tenant.ts` methods to accept PocketBase user IDs, assert membership via Prisma `userShop`, and return `shopId` plus role.
- [X] T018 [US2] Enforce tenant scoping in `src/lib/data/inventory.ts` and `src/lib/data/pos.ts` by requiring a `shopId` parameter and filtering Prisma queries accordingly.
- [X] T019 [US2] Thread `shopId` through `src/lib/services/stock.ts` so every mutation (inbound, transfer, sale, etc.) and resulting `getInventorySnapshot` operate only on the caller’s tenant data.
- [X] T020 [US2] Update all stock-related API handlers in `src/pages/api/stock/*.ts` to require PocketBase auth, pass `shopId` into service functions, and return tenant-scoped snapshots.
- [X] T021 [US2] Update `src/pages/api/items/index.ts` and `src/pages/api/items/[id].ts` to enforce PocketBase membership checks and return snapshots filtered by `shopId`.
- [X] T022 [US2] Update `src/pages/api/dashboard/index.ts`, `src/pages/api/reports/sales.ts`, and `src/pages/api/products/index.ts` to request the user’s `shopId` before running queries and to scope Prisma calls.
- [X] T023 [US2] Secure SSR inventory entry points (`src/pages/inventory/index.astro` and `src/pages/pos/index.astro`) by resolving the PocketBase user server-side and passing the `shopId` into `getInventorySnapshot` / `getPosInventory`.

**Checkpoint**: All APIs and SSR pages honor PocketBase auth + tenant scoping; cross-tenant access is blocked.

---

## Phase 5: User Story 3 – Dockerized Local Stack (Priority: P3)

**Goal**: Developers can run PocketBase, Postgres, and the Astro app via `docker compose up`, with persistent volumes and documented workflows.

**Independent Test**: Run `docker compose up --build`, confirm the `web`, `pocketbase`, and `postgres` containers reach “healthy”, visit `http://localhost:4321` and `http://localhost:8090/_`, perform a login, restart the PocketBase container, and verify data persists via named volumes.

### Implementation for User Story 3

- [ ] T024 [US3] Add a multi-stage `Dockerfile` at repo root that installs dependencies, builds the Astro app, and serves it via Node 20 using environment variables loaded from `.env.docker`.
- [ ] T025 [US3] Create `docker-compose.yml` defining `web`, `pocketbase`, and `postgres` services with health checks, shared network, env_file `.env.docker`, and named volumes (`inventauri_pg`, `inventauri_pb_data`, `inventauri_pb_public`).
- [ ] T026 [US3] Check in PocketBase bootstrap artifacts under `pocketbase/` (e.g., `pocketbase/pb_migrations/001_bootstrap.pb.js` and `pocketbase/collections/schema.json`) so the container seeds admin + profile collections.
- [ ] T027 [US3] Add Docker helper scripts and npm aliases in `package.json` (e.g., `docker:up`, `docker:down`, `docker:migrate`) plus mention them in `README.md`.
- [ ] T028 [US3] Update `quickstart.md` and `README.md` with the Compose workflow, `.env.docker` usage, and PocketBase admin login steps.

**Checkpoint**: Entire stack runs via Docker with documented workflows and persistence.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide cleanup after the migration so documentation, automation, and quality gates reflect the new stack.

- [ ] T029 Scrub remaining Supabase references from `README.md`, `ROADMAP.md`, and `todo.md`, replacing them with PocketBase details and migration guidance.
- [ ] T030 Add a `verify:pocketbase` npm script in `package.json` that runs lint, tests, and an optional Compose healthcheck, and document the command in `README.md`.

---

## Dependencies & Execution Order

1. **Phase 1 → Phase 2**: Environment scaffolding must precede dependency and helper creation.
2. **Phase 2 → User Stories**: PocketBase clients and token utilities are required for all stories.
3. **User Stories**: Execute in priority sequence (US1 → US2 → US3) for incremental value. US2 depends on US1’s auth plumbing; US3 can start once foundational Docker assets are ready but delivers the final deployment workflow.
4. **Polish**: Run after user stories to ensure documentation and scripts reflect final behavior.

---

## Parallel Execution Examples

- **US1 Parallelism**: T011–T013 (auth API routes) can proceed concurrently once shared helpers exist.
- **US2 Parallelism**: T018 (data layer) and T019 (service layer) can run in parallel as they touch different files; T020–T023 can then follow.
- **US3 Parallelism**: T024 (Dockerfile) and T025 (Compose) can be developed simultaneously; documentation updates (T028) can trail once configs stabilize.

---

## Implementation Strategy

1. **MVP First (US1)**: Complete setup + foundational phases, then deliver PocketBase login/logout/session so the UI works end-to-end with the new provider.
2. **Incremental Hardening (US2)**: Lock down all APIs and SSR pages with tenant-aware PocketBase auth, ensuring no Supabase dependencies remain server-side.
3. **Deployment Readiness (US3)**: Introduce the Dockerized workflow so the entire stack—PocketBase included—runs consistently for developers.
4. **Polish**: Clean up documentation and automation to reflect the new reality; ensure commands and references match the PocketBase/Docker world.

Each user story results in a independently testable increment, enabling demo or deployment after every phase.
