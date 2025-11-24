# Data Model – PocketBase Migration & Containerized Stack

## PocketBaseUser
- **Represents**: Authenticated staff account stored in PocketBase’s built-in `users` collection.
- **Key Fields**:
  - `id` (string, ULID) – unique primary identifier.
  - `email` (string, unique, required, max 255).
  - `password` (hashed, managed by PocketBase).
  - `emailVisibility` (boolean) – must remain false to avoid leaking addresses publicly.
  - `verified` (boolean) – controls access to the Astro app.
  - `profile` (relation to `user_profile` collection) – stores tenant metadata.
  - `lastLogin` (datetime, read-only).
- **Validation**:
  - Email must be lowercase, valid format.
  - Password minimum 12 characters (PocketBase setting).
  - `verified` must be true before issuing tokens to the UI.
- **Relationships**:
  - One-to-one with `PocketBaseProfile`.
  - Implicit many-to-one with Prisma `UserShop` through `PocketBaseProfile.shopId`.

## PocketBaseProfile
- **Represents**: PocketBase-side metadata needed to map PocketBase users to Prisma tenants/roles.
- **Key Fields**:
  - `id` (string, ULID).
  - `userId` (relation → `users` collection) – unique.
  - `shopId` (string, UUID) – matches Prisma `UserShop.shopId`.
  - `userShopId` (string, UUID) – direct foreign key into Prisma `userShop.id`.
  - `role` (enum: `owner`, `manager`, `staff`) – mirrors Prisma role.
  - `displayName` (string, optional) – used in UI header.
  - `tenantMetadata` (JSON, optional) – holds cached shop slug/name.
- **Validation**:
  - `shopId` & `userShopId` required and must be valid UUIDs.
  - `role` limited to supported union.
- **Relationships**:
  - One PocketBaseProfile references exactly one Prisma `userShop` row (validated server-side).

## PocketBaseSession (virtual entity)
- **Represents**: Auth/session payload issued by PocketBase and persisted client-side.
- **Key Fields**:
  - `accessToken` (JWT string) – short-lived.
  - `refreshToken` (string) – longer-lived, stored HttpOnly cookie.
  - `expiry` (timestamp).
  - `user` (PocketBaseUser snapshot) – includes `profile` data.
- **State Transitions**:
  1. **Authenticated**: login → store tokens → middleware sees valid `pb-access-token`.
  2. **Refresh Pending**: token expiring (<5 min) → middleware/API exchange refresh token.
  3. **Revoked/Expired**: tokens invalid → middleware redirects to `/login`.

## Prisma Shop / UserShop (existing, clarified)
- **Shop**:
  - Already contains `id`, `name`, `slug`.
  - No schema change required, but Dockerized seeding must ensure a default shop is created before syncing PocketBase users.
- **UserShop**:
  - Fields: `id`, `userId` (UUID), `shopId`, `role`, `status`.
  - **New Requirement**: `userId` now references the PocketBase `profile.userShopId` value; migration script must align IDs or introduce surrogate IDs.
  - **Validation**: only one active mapping per `(userId, shopId)`.

## Docker Service Configuration (conceptual)
- **Represents**: Compose-defined services and shared environment.
- **Fields**:
  - `serviceName` (`web`, `pocketbase`, `postgres`).
  - `image/build` (Dockerfile reference).
  - `ports` (host:container).
  - `envFile` (`.env.docker`) and inline overrides.
  - `volumes` (named volumes for data persistence).
  - `healthcheck` (command, interval, retries).
- **Relationships**:
  - `web` depends_on `postgres` + `pocketbase` (condition: service_healthy).
  - Named volumes shared between containers that need persistence (`inventauri_pg`, `inventauri_pb_data`, `inventauri_pb_public`).

## Validation Rules Summary
1. PocketBase users must have verified email + valid profile relation before access.
2. Prisma tenant checks always confirm `PocketBaseProfile.userShopId` exists and matches API payload `shopId`.
3. Docker Compose must define per-service health checks to ensure deterministic startup order.
