# Data Model — Basic Admin Settings

## BusinessProfile
**Purpose**: Stores tenant-level identity, legal, and contact details surfaced on invoices, receipts, and communications.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key (Prisma `@id @default(uuid())`) |
| shopId | UUID | Foreign key → `Shop.id`, unique (one profile per shop) |
| legalName | String | Required; 3–120 chars |
| displayName | String | Required; 3–80 chars |
| taxId | String? | Optional; normalized sans whitespace |
| email | String | Required; lowercase, valid email format |
| phone | String? | Optional; E.164 normalization |
| website | String? | Optional; must be valid HTTPS URL |
| addressLine1 | String | Required for compliance documents |
| addressLine2 | String? | Optional |
| city | String | Required |
| postalCode | String | Required; enforce country-specific regex where available |
| country | String | ISO 3166-1 alpha-2 |
| updatedBy | UUID | Supabase user id of last editor |
| createdAt | DateTime | `@default(now())` |
| updatedAt | DateTime | `@updatedAt` |
| version | Int | `@default(1)` incremented per update |

**Relationships**
- `shopId` → `Shop` (1:1)
- `updatedBy` → Supabase user (stored as UUID; joined through `UserShop` when needed)

**Validation Rules**
- All required fields must be non-empty; client and server enforce.
- `version` used for optimistic concurrency; reject update if provided version ≠ stored.
- `country` drives postal code validation rules.

**State Transitions**
- Initial create when shop is provisioned.
- Updates allowed for `owner`/`manager`; version increments enforce conflict detection.

---

## OperationalPreference
**Purpose**: Defines defaults that influence pricing, reporting, and time calculations.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| shopId | UUID | FK → `Shop.id`, unique |
| currencyCode | String | ISO 4217 code; required |
| timezone | String | IANA timezone (e.g., `Europe/Berlin`); required |
| unitSystem | Enum | `metric` or `imperial`; default `metric` |
| defaultUnitPrecision | Int | 0–4, defines display precision |
| fiscalWeekStart | Int | 0–6 (0 = Sunday); required |
| autoApplyTaxes | Boolean | Default `false`; future-proof |
| updatedBy | UUID | Supabase user id |
| createdAt | DateTime | `now()` |
| updatedAt | DateTime | `@updatedAt` |
| version | Int | `@default(1)` |

**Relationships**
- `shopId` → `Shop`

**Validation Rules**
- Enforce valid enum membership for `unitSystem`.
- `currencyCode` must exist in supported currency list (tests cover).
- Version + updatedAt for concurrency.

**State Transitions**
- Created on tenant bootstrap with defaults.
- Updates mutate individual fields; change triggers downstream recalculation.

---

## NotificationPreference
**Purpose**: Controls which alerts are active and how they are delivered for each category.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| shopId | UUID | FK → `Shop.id` |
| category | Enum | `low_stock`, `failed_sync`, `role_invite`, `audit_alert`, extendable |
| channel | Enum | `email` (v1 scope); future channels optional |
| isEnabled | Boolean | Default `true` |
| throttleMinutes | Int? | Optional rate limit per category |
| updatedBy | UUID | Supabase user id |
| createdAt | DateTime | `now()` |
| updatedAt | DateTime | `@updatedAt` |
| version | Int | `@default(1)` |

**Relationships**
- (`shopId`, `category`, `channel`) unique composite.
- One-to-many → `NotificationRecipient`.

**Validation Rules**
- Ensure only supported categories appear (contract-driven).
- When `isEnabled = false`, recipients list may be empty.

**State Transitions**
- CRUD limited to `owner`/`manager`.
- Version guard for concurrent edits.

---

## NotificationRecipient
**Purpose**: Assigns users (or fallback emails) to receive a given notification category.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| preferenceId | UUID | FK → `NotificationPreference.id` |
| userShopId | UUID? | Optional FK → `UserShop.id` for internal staff |
| email | String? | Optional external email; required if `userShopId` null |
| createdAt | DateTime | `now()` |

**Relationships**
- Many recipients per preference.
- Unique constraint preventing duplicate (`preferenceId`, `userShopId`/`email`).

**Validation Rules**
- One of `userShopId` or `email` must be present.
- `userShopId` must belong to same `shopId` as preference.

**State Transitions**
- Adjusted whenever recipients change via settings UI.

---

## StaffInvitation
**Purpose**: Tracks invitations and role assignments prior to `UserShop` activation.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| shopId | UUID | FK → `Shop.id` |
| email | String | Lowercased invite email |
| role | Enum | `owner`, `manager`, `staff` (UI restricts to allowed subset) |
| status | Enum | `pending`, `accepted`, `revoked`, `expired` |
| supabaseInvitationId | String | Reference to Supabase auth invite |
| invitedBy | UUID | Supabase user id |
| expiresAt | DateTime | Typically 7 days from invite |
| acceptedAt | DateTime? | Set when user joins |
| revokedAt | DateTime? | Set when manually revoked |
| createdAt | DateTime | `now()` |
| updatedAt | DateTime | `@updatedAt` |

**Relationships**
- `shopId` → `Shop`
- Upon acceptance, create/update `UserShop` record linked by email/user id.

**Validation Rules**
- `status` transitions enforced (see below).
- Cannot invite same email twice while a `pending` invitation exists (unique index).

**State Transitions**
- `pending` → `accepted` when Supabase user confirms link (creates `UserShop`).
- `pending` → `revoked` via admin action.
- `pending` → `expired` via daily job once `expiresAt` passed.

---

## UserShop (extension)
**Purpose**: Existing mapping between Supabase users and shops; extended for access control management.

**Additional Fields**
| Field | Type | Notes |
|-------|------|-------|
| status | Enum | `active`, `deactivated`; default `active` |
| deactivatedAt | DateTime? | Timestamp when access revoked |
| deactivatedBy | UUID? | Supabase user id who initiated |

**Validation Rules**
- Only `owner` can deactivate an `owner`; managers cannot demote owners.
- When transitioning to `deactivated`, ensure Supabase auth user disabled via admin API.

**State Transitions**
- `active` ↔ `deactivated` (reactivation allowed for staffing churn).
- Keep audit log entry aligned with transitions.

---

## SettingsAuditLog
**Purpose**: Immutable record of configuration changes to satisfy FR-009 and operational forensics.

**Fields**
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| shopId | UUID | FK → `Shop.id` |
| section | Enum | `business_profile`, `operational`, `notifications`, `staff` |
| actorId | UUID | Supabase user id |
| actorEmail | String | cached for readability |
| changeType | Enum | `create`, `update`, `delete`, `deactivate` |
| diff | Json | JSON Patch-style payload outlining field-level changes |
| createdAt | DateTime | `now()` |

**Relationships**
- `shopId` → `Shop`

**Validation Rules**
- `diff` must include before/after for mutable fields.
- Entries append-only; no updates/deletes permitted.

**State Transitions**
- Each successful settings mutation inserts a log row.
- Read-only APIs paginate by `createdAt` descending.

---

## Cross-Cutting Considerations
- **Versioning**: `BusinessProfile`, `OperationalPreference`, and `NotificationPreference` implement `version` increments to support optimistic concurrency. API must require clients to submit `version` with updates.
- **Tenancy Enforcement**: All new tables include `shopId` and queries must constrain by the caller’s resolved shop.
- **Cascade Behavior**: No cascades from `Shop` beyond existing ones; deleting a shop (future admin operation) cascades to new settings tables via `@relation(onDelete: Cascade)`.
- **Indexing**: Add indexes on (`shopId`, `category`) for notification lookups and on `status` for invitation management jobs.
