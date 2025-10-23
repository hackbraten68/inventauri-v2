# Research Findings: Dashboard Operational Metrics

## Decision: Sales Trend Delta Comparison Window
- **Decision**: Calculate sales deltas by aggregating `sale` stock transactions for the selected range and the immediately preceding range, mirroring the metric (revenue vs. units) shown in the dashboard totals.
- **Rationale**: Aligns with current `getDashboardSnapshot` logic, keeps logic server-side for consistency, and avoids duplicate aggregation code in the UI. Matching the totals metric prevents user confusion when switching between amount and quantity views.
- **Alternatives considered**:
  - Precomputing deltas in a scheduled job — rejected because the dashboard already fetches live data and operators expect up-to-date comparisons.
  - Performing calculations client-side — rejected to avoid duplicating business logic and leaking raw transaction data to the browser.

## Decision: Days of Cover Formula
- **Decision**: Use the last seven completed days of `sale` transactions (or the full available history if shorter) to compute average daily sales; divide on-hand quantity by this velocity and display the result rounded to one decimal place, falling back to “Insufficient data” when the observed period is <3 days or no sales occurred.
- **Rationale**: Seven-day windows smooth short-term volatility while staying responsive to demand changes; aligning with existing assumption in spec ensures predictability. Setting a three-day minimum avoids misleading values derived from extremely sparse data.
- **Alternatives considered**:
  - Using rolling 30-day average — rejected because the spec targets quick operational decisions and longer windows would lag.
  - Calculating based on all-time sales — rejected due to seasonal drift and mismatch with replenishment cadence.

## Decision: Inbound Coverage Source
- **Decision**: Derive inbound coverage from `stockTransaction` records with `transactionType = 'inbound'`, summing quantities and capturing the earliest `occurredAt` per low-stock item within the selected range; expose both total inbound units and next expected arrival description.
- **Rationale**: Inbound transactions already exist in the operational database, satisfying the “reuse Prisma queries” constraint. Operators care about actual receipts within the chosen timeframe; grouping and summarising this server-side keeps the dashboard lightweight.
- **Alternatives considered**:
  - Introducing a new purchase order table — rejected for scope creep and because inventory already records inbound receipts.
  - Reading `quantityReserved` from stock levels — rejected since it reflects customer reservations rather than supplier shipments.

## Decision: Testing Approach
- **Decision**: Extend existing Vitest suites with targeted unit tests for the data assembly helpers and contract tests for `/api/dashboard` to assert presence and shape of the new fields.
- **Rationale**: Fits current testing toolchain, keeps calculations verifiable without hitting the database in every test, and enforces API compatibility for the dashboard client.
- **Alternatives considered**:
  - Adding end-to-end browser tests — deferred; the spec emphasises minimal additions and existing contract tests already cover API regressions.
