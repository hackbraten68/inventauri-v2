# Data Model: Dashboard Operational Metrics

## DashboardSnapshot
- **Purpose**: API payload returned by `/api/dashboard` summarising operator-facing metrics for the selected date range.
- **Fields**:
  - `rangeDays` (number) — Resolved range in days used for calculations.
  - `totals` (object)
    - `itemCount` (number) — Active items with stock records.
    - `totalOnHand` (number) — Sum of on-hand quantities across all stock levels.
    - `totalValue` (number) — Monetary valuation using item pricing metadata.
    - `salesQuantity` (number) — Units sold in the current range.
    - `salesRevenue` (number) — Revenue equivalent for the same period.
    - `salesDelta` (object)
      - `absolute` (number) — Difference between current and prior period in the currently active metric (units or revenue).
      - `percentage` (number | null) — Percent change; `null` when prior total is zero.
      - `direction` ('up' | 'down' | 'flat' | 'na') — Indicator for UI.
  - `warnings` (InventoryRiskItem[])
  - `mostSold` (TopSeller[])
  - `recentTransactions` (RecentTransaction[])

## InventoryRiskItem
- **Derived From**: `item`, `itemStockLevel`, `stockTransaction` aggregates.
- **Fields**:
  - `itemId` (string, UUID) — Unique item identifier.
  - `sku` (string) — Per-tenant SKU.
  - `itemName` (string)
  - `warehouseId` (string, UUID)
  - `warehouseName` (string)
  - `quantityOnHand` (number)
  - `threshold` (number)
  - `daysOfCover` (number | null) — `onHand / avgDailySales`; `null` when insufficient history.
  - `daysOfCoverStatus` ('ok' | 'risk' | 'insufficient-data') — UI helper tag.
  - `avgDailySales` (number) — Smoothed velocity used in calculation.
  - `inboundCoverage` (InboundCoverage | null)

## InboundCoverage
- **Derived From**: `stockTransaction` records with `transactionType = 'inbound'`.
- **Fields**:
  - `totalInboundUnits` (number) — Sum of inbound quantities for the item within the selected range (future-dated allowed).
  - `nextArrivalDate` (Date | null) — Earliest occurrence timestamp among inbound transactions.
  - `references` (string[]) — Distinct reference identifiers for inbound orders (max 5 for UI).

## TopSeller
- **Fields**:
  - `itemId` (string)
  - `name` (string)
  - `sku` (string)
  - `quantity` (number)

## RecentTransaction
- **Fields**:
  - `id` (string, UUID)
  - `itemId` (string)
  - `itemName` (string)
  - `sku` (string)
  - `warehouseName` (string)
  - `quantity` (number)
  - `type` (`TransactionType`)
  - `occurredAt` (Date)
  - `reference` (string | null)

## Supporting Aggregates
- **PriorRangeSales**: Pre-computed totals for the period immediately preceding the selected window, keyed by metric (`units`, `revenue`) to support sales delta calculations.
- **SalesVelocity**: Map of `itemId` → average daily sales plus observation length, enabling consistent reuse across warnings and summary statistics.
