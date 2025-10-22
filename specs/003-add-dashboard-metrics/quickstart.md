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
3. **Implement data changes**
   - Update `src/lib/data/dashboard.ts` with new aggregation helpers:
     - Sales delta queries.
     - Days-of-cover computation (shared velocity utility).
     - Inbound coverage summariser.
   - Extend the returned `DashboardSnapshot` type accordingly.
4. **Update API contract tests**
   - Add assertions in `tests/contracts/dashboard.test.ts` (create if missing) to verify the new JSON fields.
5. **Update UI**
   - Enhance `src/components/dashboard/DashboardOverview.tsx` to render:
     - Sales delta badges inline with totals.
     - Days-of-cover text within each warning block.
     - Inbound coverage details beside warnings.
   - Keep layout changes minimal (badges, inline copy).
6. **Run test suite**
   ```bash
   npm test
   ```
   - Add focused unit tests for new helper functions under `tests/unit/`.
   - Provide integration coverage for data assembly under `tests/integration/`.
7. **Smoke test**
   - Refresh dashboard in the browser across 7, 14, and 30 day ranges.
   - Validate placeholder states for missing prior data or low sales history.

## Troubleshooting

- If Prisma complains about missing tables, run `npm run db:migrate`.
- When seeded data lacks inbound transactions, create a few via existing admin workflows or run a seed script to simulate purchase receipts.
