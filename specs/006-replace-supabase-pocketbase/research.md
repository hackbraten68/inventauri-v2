# Research – Replace Supabase with PocketBase & Containerize Stack

## Decision 1: Performance Goals for PocketBase Migration
- **Decision**: Target ≤300 ms p95 latency for PocketBase login/token refresh requests and ≤500 ms p95 for authenticated Astro API routes when running locally in Docker.
- **Rationale**: The app serves micro-shops with lightweight workflows; matching or slightly improving Supabase-era responsiveness prevents regressions for POS operations. These thresholds align with what Node 20 + PocketBase can deliver on a laptop while keeping headroom when deployed elsewhere.
- **Alternatives Considered**:
  - *No explicit goal*: Rejected because the migration could quietly degrade UX with slower PocketBase queries.
  - *>1 s tolerances*: Too lenient for POS actions that must feel instantaneous.

## Decision 2: Operational Constraints for the Containerized Stack
- **Decision**: Limit each service container (Astro app, PocketBase, Postgres) to ≤1 vCPU / 1 GiB RAM defaults for local development, expose services only on localhost, and persist PocketBase + Postgres data via named volumes.
- **Rationale**: Keeps resource usage modest for laptops, satisfies the user request to containerize while following PocketBase’s recommendation to persist `/pb_data` and `/pb_public`. Local-only ports reduce accidental exposure of auth data; Compose resource hints prevent PocketBase from starving Postgres.
- **Alternatives Considered**:
  - *Running PocketBase outside Docker*: Conflicts with the “put PocketBase into Docker” directive and complicates orchestration.
  - *Sharing a single volume for both databases*: Risks corruption and makes backups harder.

## Decision 3: Scale & Scope Assumptions
- **Decision**: Design for ~100 shops, each with up to 20 staff accounts and 10 warehouses, yielding ≈2 000 items and ≤100 000 stock transactions per tenant.
- **Rationale**: Matches “micro-shop” positioning yet leaves room for growth; ensures PocketBase collection indexes and Prisma queries are tuned for multi-tenant data without prematurely optimizing for massive scale.
- **Alternatives Considered**:
  - *Enterprise-scale assumptions (10k tenants)*: Would force sharding decisions not requested.
  - *Single-tenant scope*: Contradicts existing multi-tenant schema and would under-design authorization.

## Decision 4: PocketBase Integration Best Practices
- **Decision**: Use PocketBase email/password auth with the official JS SDK on the client, store the auth store in memory, and mirror the issued JWT into an HttpOnly `pb-access-token` cookie plus `pb-refresh-token`. Server-side Astro routes verify tokens via the Admin REST API using a dedicated PocketBase service account.
- **Rationale**: Mirrors Supabase’s pattern while following PocketBase’s advice to rely on the SDK’s auth store and server verification endpoints. HttpOnly cookies keep SSR middleware simple and secure.
- **Alternatives Considered**:
  - *LocalStorage for tokens*: Vulnerable to XSS; harder to integrate with middleware.
  - *Custom JWT issuer*: Adds complexity and diverges from PocketBase’s built-in auth pipeline.

## Decision 5: Docker Compose Best Practices
- **Decision**: Provide a `docker-compose.yml` with three services (`web`, `pocketbase`, `postgres`), share an `.env.docker` file for secrets, declare explicit health checks, and mount named volumes (`inventauri_pg`, `inventauri_pb_data`, `inventauri_pb_public`). Build `web` via a multi-stage Dockerfile (deps → builder → runner) to keep images lean.
- **Rationale**: Reflects widely adopted Compose conventions; volumes map directly to PocketBase recommendations. Health checks enable `depends_on` with `condition: service_healthy`, ensuring Astro waits for Postgres/PocketBase before running migrations or seeding.
- **Alternatives Considered**:
  - *Single container running everything*: Breaks isolation, complicates debugging, and contradicts best practice for PocketBase.
  - *Bind-mounting node_modules*: Slower cross-platform and unnecessary once multi-stage builds exist.

## Decision 6: PocketBase ↔ Prisma Tenant Mapping Pattern
- **Decision**: Store the Prisma `userShop.id` inside a PocketBase `profile` collection field (or use a relation) and cache `shopId` inside PocketBase auth metadata so Astro middleware can resolve tenant membership without extra DB round-trips. Prisma continues enforcing tenant isolation via `shopId` filters.
- **Rationale**: Maintaining a direct mapping ensures `requireUser` replacements can supply both PocketBase user data and tenant role info, keeping existing tenant guard utilities (e.g., `getUserShopIdOrThrow`) mostly intact.
- **Alternatives Considered**:
  - *Separate lookup table outside PocketBase*: Adds another service and synchronisation burden.
  - *Encoding tenant info solely in JWT custom claims*: Less flexible when tenant assignments change without reissuing tokens.

## Decision 7: Astro Middleware & API Token Validation Pattern
- **Decision**: Replace Supabase client usage with a lightweight PocketBase verification helper that checks the `pb-access-token` cookie on each SSR request, refreshes via PocketBase if near expiry, and injects the validated user into locals/context for API routes. APIs that currently call Supabase’s `auth.getUser` will instead call PocketBase’s `/api/collections/users/records/{id}` using the Admin token to ensure freshness.
- **Rationale**: Keeps middleware behavior consistent (redirect unauthenticated users) while relying on PocketBase’s REST primitives. Using the admin token avoids trusting client-provided claims blindly.
- **Alternatives Considered**:
  - *Relying solely on client-side auth guards*: Would expose SSR routes to anonymous access and break current design.
  - *Validating tokens via JWT library without PocketBase*: Would miss revocations and password changes.
