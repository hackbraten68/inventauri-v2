# Variant Model Cutover Plan

This document describes a staged, backward-compatible rollout from `Item` to `Product` + `ProductVariant` while keeping the app functional at all times.

## Goals
- Introduce `Product` and `ProductVariant` with tenant scoping.
- Maintain all existing `Item`-based flows during transition.
- Gradually migrate stock and transaction references to `variantId`.
- Ensure contract tests and dashboards continue to pass during cutover.

## Current State (after Variant Scaffold)
- Prisma models added (applied via `variant_scaffold`):
  - `Product(shopId, name, description?, isActive, createdAt, updatedAt)`
  - `ProductVariant(productId, shopId, sku, unit, price?, barcode?, isActive, createdAt, updatedAt)` with `@@unique([shopId, sku])`.
- No existing flows reference products/variants yet; all stock still uses `Item`.

## Staged Migration Plan

### Phase 1: Scaffold (DONE)
- Add `Product` & `ProductVariant` tables.
- No references added to stock tables yet.

### Phase 2: Dual-write Compatibility (Optional)
- Extend create-item API payload to optionally include `product` + `variants` fields.
- Service behavior:
  - If a payload includes product/variant, create a `Product` + single `ProductVariant` and mirror to `Item` as the current source of truth.
  - If not provided, keep behavior as-is.
- Rationale: Allows early UI exploration without impacting stock tables.

### Phase 3: Introduce variantId on stock tables
- DB migration (create-only, then apply):
  - Add nullable `variantId` to `ItemStockLevel` and `StockTransaction`.
  - Create FK to `ProductVariant(id)` and indices.
- Backfill logic:
  - For each existing `Item`, create a default `Product` + `ProductVariant` per tenant if not already created (or derive from Phase 2 dual-write artifacts).
  - Assign `variantId` for all `ItemStockLevel` and `StockTransaction` rows based on the mapped default variant.
- App changes:
  - Update services to read/write `variantId` when present; otherwise fall back to `itemId`.
  - Keep endpoints backward-compatible (accept `itemId` for now).

### Phase 4: Cutover and Enforcement
- Flip write paths to require `variantId`.
- Deprecate `itemId` on new writes (accept for a grace period, translate to `variantId`).
- After grace period:
  - Enforce NOT NULL on `variantId` in `ItemStockLevel` and `StockTransaction`.
  - Freeze `Item` writes; keep reads for historical compatibility or plan archival.

### Phase 5: Cleanup
- Remove or archive `Item` where feasible.
- Update dashboards and reports to use `Product`/`ProductVariant`.
- Update contracts and tests to reflect the new model entirely.

## API Compatibility Strategy
- Maintain existing endpoints (`/api/items`, `/api/stock/*`) during migration.
- Introduce new product/variant endpoints when needed:
  - `POST /api/products` (with variants), `GET /api/products`, `GET /api/variants/{id}` etc.
- Translate legacy `itemId` to `variantId` internally once backfill is complete.

## Tenant & Constraints
- `ProductVariant` enforces `@@unique([shopId, sku])`, matching `Item` behavior.
- All stock flows remain tenant-scoped; variant migrations must preserve `shopId` consistency.

## Testing Plan
- Contract tests
  - Keep current items/inventory/reports tests green throughout.
  - Add new contract tests for products/variants as endpoints become available.
- Backfill tests
  - Verify `variantId` backfilled for all existing rows.
  - Ensure no cross-tenant leakage after cutover.
- Performance smoke
  - Ensure POS path and dashboard remain within targets.

## Rollback Strategy
- Each phase uses additive migrations first; constraints (NOT NULL) enforced only after successful backfill and verification.
- If issues arise in Phase 3/4, revert to `itemId` reads/writes and retry backfill.

## Open Questions
- Pricing source of truth: variant-level `price` vs. item metadata; plan to standardize on `ProductVariant.price`.
- Category modeling: introduce `Category` and `Product.categoryId` in a later migration.
- RLS/Policies for new tables when Supabase RLS is adopted.
