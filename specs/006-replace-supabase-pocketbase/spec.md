# Feature Specification: Replace Supabase with PocketBase & Containerize Stack

**Feature Branch**: `006-replace-supabase-pocketbase`  
**Created**: 2025-11-24  
**Status**: Draft  
**Input**: User description: "i want to replace supabase with pocketbase.io, if best practice to put pocketbase.io into a docker container then take into consideration to put the entire project into docker."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - PocketBase Sign-in Flow (Priority: P1)

Store staff can authenticate against the PocketBase instance (instead of Supabase), obtain a secure session cookie, and browse dashboard, inventory, and POS flows without breakage.

**Why this priority**: Auth is the entry point to every protected workflow; without a working PocketBase login the app is unusable.

**Independent Test**: Spin up the stack, sign in with a PocketBase user, confirm redirect to `/dashboard`, and verify the cookie/session persists after refresh and logout works.

**Acceptance Scenarios**:

1. **Given** a PocketBase user exists and the stack runs, **When** the user submits valid credentials, **Then** they receive an `sb-access-token` replacement cookie backed by PocketBase and land on `/dashboard`.
2. **Given** an expired/invalid PocketBase session cookie, **When** the user hits `/inventory`, **Then** the middleware redirects them to `/login` and no data leaks.

---

### User Story 2 - API Authorization via PocketBase (Priority: P2)

Inventory, POS, and settings APIs validate PocketBase tokens server-side, map PocketBase users to Prisma tenants, and reject requests when the token or tenant relationship is invalid.

**Why this priority**: Prevents cross-tenant data access once Supabase JWT verification is removed.

**Independent Test**: Call `/api/items` with a PocketBase bearer token and confirm `201` creation; repeat with a token for another tenant or without membership and expect `403`.

**Acceptance Scenarios**:

1. **Given** a PocketBase bearer token for tenant A, **When** the client creates an item via `/api/items`, **Then** the API stores the record with tenant A’s `shopId` and returns a tenant-scoped snapshot.
2. **Given** a bearer token for tenant B, **When** they attempt to mutate tenant A’s itemId, **Then** the API responds `403` without touching tenant A’s data.

---

### User Story 3 - Dockerized Local Stack (Priority: P3)

Developers can launch PocketBase (in Docker), the Astro app, and supporting Postgres via a single `docker compose up`, with hot reload for the app and persistent PocketBase volumes.

**Why this priority**: Simplifies onboarding and aligns with the project requirement that everything runs inside Docker, especially since PocketBase best practice is containerized deployment.

**Independent Test**: Run `docker compose up --build`, verify all containers report healthy, and confirm the web UI and PocketBase admin console are reachable without manual installs.

**Acceptance Scenarios**:

1. **Given** Docker is installed, **When** a developer executes `docker compose up`, **Then** it starts the Astro app, PocketBase, and Postgres with shared `.env` configuration and volumes for persistence.
2. **Given** PocketBase container restarts, **When** the stack comes back up, **Then** user accounts and auth settings persist via the mounted volume.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when PocketBase is unreachable during login or token refresh? App should fail closed, surface a friendly error, and never fall back to stale Supabase credentials.
- How does system handle migrating existing Supabase users lacking PocketBase records? Need a safe migration plan or script plus communication for password resets.
- What occurs if Docker volumes are missing or corrupted? Compose workflow should re-create PocketBase schema without losing Prisma data, or provide documented recovery.
- How are tokens handled when the PocketBase admin secret rotates? Clients must automatically request a fresh token without manual redeploys.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST remove Supabase client/admin dependencies and initialize PocketBase JS/REST clients for both browser and server contexts.
- **FR-002**: System MUST authenticate users against PocketBase (email/password) and store sessions in secure, HttpOnly cookies compatible with existing middleware redirects.
- **FR-003**: API routes MUST validate PocketBase bearer tokens, map them to Prisma `userShop` relationships, and enforce tenant scoping on every query/mutation.
- **FR-004**: System MUST provide a migration or import procedure to move existing Supabase users (or create equivalent PocketBase accounts) without losing tenant-role assignments.
- **FR-005**: Docker Compose MUST orchestrate PocketBase, the Astro app, and Postgres, wiring environment variables/secrets and ensuring PocketBase runs in its own container with persistent storage.
- **FR-006**: Settings UI MUST expose new configuration where appropriate (e.g., PocketBase admin URL or seed admin credentials) or document defaults for ops.
- **FR-007**: Monitoring/logging MUST capture PocketBase auth failures and container health, or provide hooks to observe them locally.

*Clarifications Needed*:

- **FR-008**: System MUST integrate PocketBase real-time subscriptions for inventory updates [NEEDS CLARIFICATION: real-time scope and performance expectations not described].

### Key Entities *(include if feature involves data)*

- **PocketBaseUser**: Represents an authenticated staff account managed by PocketBase; key attributes include `id`, `email`, `verified`, `lastLogin`, and a custom field referencing the Prisma `userShop` record or `shopId`.
- **PocketBaseSession/Credential**: Encapsulates the auth token + refresh token issued by PocketBase; stored client-side in cookies/local storage and used server-side for bearer auth.
- **DockerService Stack**: Logical grouping describing the three containers (Astro app, PocketBase, Postgres) plus shared networks and volumes defined in Compose.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of protected routes rely on PocketBase tokens—removing Supabase env vars should not break login or API calls.
- **SC-002**: `docker compose up --build` completes in <2 minutes on a standard dev machine (16 GB RAM) and serves the app at `http://localhost:4321` with PocketBase reachable at its admin port.
- **SC-003**: At least 95% of regression tests that previously depended on Supabase pass using PocketBase stubs/mocks, demonstrating parity.
- **SC-004**: Auth failure logs show <1% error rate during manual QA of sign-in/sign-out workflows after migration.
