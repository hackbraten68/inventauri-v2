# Research Findings — Basic Admin Settings

## Settings Persistence & Multi-Tenant Scope
Decision: Create dedicated Prisma models (`BusinessProfile`, `OperationalPreference`, `NotificationPreference`, `StaffInvitation`) keyed by `shopId` to persist settings per tenant while keeping the existing `Shop` table lean.  
Rationale: Mirrors current multi-tenant pattern where operational data (items, stock, transactions) live in their own tables and reference `shopId` (`prisma/schema.prisma`). Separate models allow precise validation, audit trails, and easier future migrations without overloading the `Shop` entity.  
Alternatives considered: Expand the `Shop` table with JSON columns (would complicate validation and partial updates); store all settings in a single JSON blob (difficult to audit changes and enforce per-field constraints).

## Audit Logging Strategy
Decision: Introduce a `SettingsAuditLog` table that records `shopId`, section, actor, timestamp, and before/after JSON snapshots for every settings mutation, with append-only writes triggered from services.  
Rationale: FR-009 requires a comprehensive audit trail. An explicit table keeps logs queryable and aligns with how other transactional data is stored (e.g., `StockTransaction`). It also supports future reporting without depending on external services.  
Alternatives considered: Reuse stock transaction logging (semantically mismatched); rely on Supabase log drains (external dependency, harder to expose inside the app).

## Access Control Enforcement
Decision: Gate every settings API route with `requireUser` plus `getUserTenantRoleOrThrow`, allowing only `owner` and `manager` roles to mutate settings while exposing read access to `owner`/`manager` (and limited read for `staff` where needed).  
Rationale: `src/lib/tenant.ts` already provides utilities for resolving tenant roles, and FR-001/FR-008 demand strict role enforcement. Extending these helpers keeps authorization consistent with inventory APIs.  
Alternatives considered: Front-end role checks only (insufficient for security); creating a new RBAC service (unnecessary complexity for current scope).

## Staff Invitation Flow
Decision: Use `supabaseAdmin` (service key) to create invitations, persist pending invites in `StaffInvitation` with expiry, and upon acceptance link the Supabase user to `UserShop`. Deactivation updates both Supabase auth (disable user) and marks the invitation/assignment inactive.  
Rationale: Supabase is the authoritative user store (`src/lib/auth/server.ts` + `src/lib/supabase-admin.ts`). Leveraging its invite + disable capabilities keeps authentication centralized while meeting FR-007/FR-008.  
Alternatives considered: Manual password provisioning (poor UX, security risk); custom invite tokens stored locally (duplicates Supabase capability).

## Concurrent Edit Handling
Decision: Add a monotonically increasing `version` column (Prisma `Int @default(1)`) alongside `updatedAt` on mutable settings tables and require clients to send the last known version; reject updates when versions diverge.  
Rationale: The spec’s edge cases call for conflict detection. Version-based optimistic concurrency is lightweight, works well with Prisma, and surfaces actionable errors to the second editor.  
Alternatives considered: Pessimistic locking (not supported across Supabase connection pooling); silent last-write-wins (violates requirement to warn second editor).
