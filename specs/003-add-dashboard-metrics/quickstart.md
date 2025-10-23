# Quickstart: Dashboard Operational Metrics

## Prerequisites

- Node.js 20.x with pnpm/npm compatible with the repo tooling.
- PostgreSQL instance reachable via `DATABASE_URL` in `.env.local`.
- Seed data containing stock transactions (sale + inbound) and stock levels for at least a few SKUs.

## Recommended Workflow

1. **Install & prepare**
   ```bash
   npm install
   npm run db:generate
   ```
2. **Validate current dashboard**
   ```bash
   npm run dev
   ```
   - Visit `http://localhost:4321/dashboard`.
   - Confirm baseline metrics render with seeded data.
3. **Run targeted regression tests**
   ```bash
   npm test tests/unit/dashboard-sales-delta.spec.ts
   npm test tests/unit/dashboard-days-cover.spec.ts
   npm test tests/unit/dashboard-inbound-coverage.test.ts
   npm test tests/contracts/dashboard.test.ts
   ```
   - Confirms the data helpers and API contract expose sales deltas, days of cover, and inbound coverage fields.
4. **Validate API payload manually**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:4321/api/dashboard?range=7 | jq '.warnings[] | {sku, daysOfCover, inboundCoverage}'
   ```
   - Ensure warnings include `daysOfCover`, `daysOfCoverStatus`, and, when inventory is on the way, `inboundCoverage` metadata.
5. **Review UI behaviour**
   - With `npm run dev` running:
     - Inspect the totals card: sales delta badge should display trend direction and fallback text when no prior data exists.
     - In the warning list, verify days-of-cover copy and inbound replenishment details render with the seeded data (including the “Zu wenig Daten” message for sparse history).
6. **Smoke test**
   - Switch between 7, 14, and 30 day ranges and confirm metrics refresh without a full reload.
   - Observe warnings for SKUs without recent sales to ensure placeholders remain accessible.

## Troubleshooting

- If Prisma complains about missing tables, run `npm run db:migrate`.
- When seeded data lacks inbound transactions, create a few via existing admin workflows or run a seed script to simulate purchase receipts.
