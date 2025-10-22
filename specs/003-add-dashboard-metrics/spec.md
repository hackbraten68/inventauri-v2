# Feature Specification: Dashboard Operational Metrics

**Feature Branch**: `003-add-dashboard-metrics`  
**Created**: 2025-10-22  
**Status**: Draft  
**Input**: User description: "**Goal**: Keep the dashboard focused on minimal but functional insights while adding a handful of metrics that help operators make day-to-day decisions quickly.

**Metrics to Add**:
1. **Sales Trend Delta** - Compare revenue (or unit sales) for the selected date range against the preceding equal range and surface the delta alongside existing totals.
2. **Days of Cover for Key Items** - For items already flagged in low-stock warnings, calculate days remaining until stock-out based on recent sales velocity and display it next to each warning entry.
3. **Purchase Order Alignment** - Surface open purchase order quantities (or inbound units) for the selected range so users can verify replenishment keeps pace with sales.

**Constraints**:
- Reuse existing Prisma queries or data already fetched for the dashboard; avoid introducing complex visualizations or heavy analytics pipelines.
- Maintain the existing dashboard layout, adding metrics as small badges, inline text, or extended card copy to preserve simplicity.
- Add basic unit tests or integration tests that confirm each new field is computed and exposed by the dashboard API."

## Clarifications

### Session 2025-10-22

- Q: Should the sales comparison always use revenue, units, or mirror the metric shown in the dashboard totals? → A: Mirror the metric shown in existing totals.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare Sales Momentum (Priority: P1)

Operations managers review the sales dashboard to see whether current performance is trending up or down relative to the previous comparable period so they can adjust staffing and promotions quickly.

**Why this priority**: Trend visibility determines daily operational adjustments and is the core reason operators open the dashboard.

**Independent Test**: Load the dashboard for a configured date range and confirm that the sales delta is visible, interpretable, and matches a manually calculated baseline comparison.

**Acceptance Scenarios**:

1. **Given** a selected date range with recorded sales, **When** the dashboard loads, **Then** the total for the range and the delta versus the previous equal range appear together with an indicator showing positive, negative, or flat performance.
2. **Given** a user who switches to a new date range, **When** the dashboard refreshes metrics, **Then** the comparison recalculates using the immediately preceding equal range and updates the displayed delta value and percentage.

---

### User Story 2 - Gauge Low-Stock Longevity (Priority: P2)

Inventory planners use the dashboard to understand how long low-stock items will last so they can triage replenishment without exporting data.

**Why this priority**: Providing days of cover at the point of the warning prevents stockouts and manual spreadsheet checks.

**Independent Test**: Trigger a low-stock warning for a sample SKU, verify the dashboard shows days of cover alongside the warning, and validate the calculation against historical sales data.

**Acceptance Scenarios**:

1. **Given** an item flagged in low-stock warnings with at least seven days of sales history, **When** the dashboard surfaces the warning, **Then** it displays the calculated days of cover rounded to the nearest tenth and a note when coverage falls below the defined threshold.

---

### User Story 3 - Verify Purchase Order Alignment (Priority: P3)

Buyers need to confirm that inbound purchase orders will arrive in time to cover low-stock risk items directly from the dashboard.

**Why this priority**: Ensures supply plans remain aligned without switching tools, reducing missed replenishment issues.

**Independent Test**: For a SKU with a low-stock warning and an inbound order, confirm that the dashboard shows inbound quantities and arrival dates next to the warning and that totals align with the order system.

**Acceptance Scenarios**:

1. **Given** a low-stock item with open purchase orders, **When** the dashboard renders the warning, **Then** it lists inbound quantities and expected arrival windows so the operator can verify coverage and timing.

---

### Edge Cases

- Prior period has no sales data, so the delta should display as "No comparison available" instead of zero.
- Items flagged as low-stock without sufficient sales history must show "Insufficient data" for days of cover.
- Multiple inbound purchase orders for the same SKU should aggregate quantities and highlight the earliest arrival date.
- Selected date range overlapping partially with today should use available completed days when calculating averages.
- Currency or unit differences across data sources must be normalized before calculations to avoid misleading comparisons.
- Sales comparisons must respect whether the dashboard is currently showing revenue totals or unit totals to prevent mismatched context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST display the total sales amount (and/or units) for the selected date range alongside the absolute and percentage delta versus the immediately preceding equal range, using the same measurement (revenue or units) currently shown in the totals card.
- **FR-002**: The sales delta MUST include a directional indicator (positive, negative, or flat) that remains readable without color reliance.
- **FR-003**: For every low-stock warning, the dashboard MUST calculate and display days of cover using current on-hand inventory divided by recent average daily sales velocity.
- **FR-004**: When recent sales velocity cannot be derived (less than seven days of history), the system MUST show an explanatory placeholder instead of a numeric days-of-cover value.
- **FR-005**: The dashboard MUST surface inbound purchase order quantities and expected arrival dates next to the relevant low-stock warning.
- **FR-006**: The dashboard API MUST expose the new comparison, days-of-cover, and inbound coverage fields so automated tests can assert their presence and values.
- **FR-007**: Calculations MUST respect the date range selected by the user and refresh when the range changes without requiring a full page reload.

### Key Entities *(include if feature involves data)*

- **DashboardSummary**: Aggregated metrics for the selected date range, including total sales, comparison range dates, delta absolute value, delta percentage, and indicator state.
- **InventoryRiskItem**: Representation of a SKU flagged for low stock containing identifier, current on-hand quantity, reorder threshold, recent average daily sales velocity, calculated days of cover, and explanatory status.
- **PurchaseOrderCommitment**: Inbound supply details tied to a SKU, capturing total inbound quantity within the comparison horizon, earliest expected arrival date, and supplier reference for display context.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated usability tests, 90% of operators correctly state whether sales are trending up or down within 5 seconds of dashboard load for a selected date range.
- **SC-002**: Quality assurance scripts verify that days-of-cover values are present for at least 95% of low-stock items that have seven or more days of historical sales data.
- **SC-003**: Within one month of release, support requests tagged "unclear low-stock urgency" decrease by 40% compared to the prior month.
- **SC-004**: In post-release surveys, 85% of operators report they can confirm inbound order coverage for low-stock items directly within the dashboard without exporting data.

## Assumptions

- Existing data pipelines already provide accurate sales totals, low-stock flags, and purchase order details to the dashboard service.
- Average daily sales velocity is calculated using the most recent seven completed days unless otherwise configured.
- All monetary values are expressed in a single operating currency per tenant, so no additional conversion is required within the dashboard.
