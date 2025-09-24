# Inventauri Engineering Constitution

## Code Quality
- Treat the Prisma schema and Supabase policies as first-class code; every schema change ships with docs and migration tests.
- Prefer clear, composable components and server utilities over clever abstractions; optimize for readability and onboarding speed.
- Enforce strict TypeScript types and linting; any `any` or unsafe cast needs a TODO with owner and expiry.
- Review changes with a reliability mindset—surface risks, rollback strategy, and observability hooks before merge.

## Testing Standards
- Cover every API route and critical client workflow with automated tests (unit + integration) that run in CI with sample data.
- Snapshot POS and dashboard states after transfers, returns, and sales to prevent regressions in totals and history feeds.
- For bugs, always add a failing test first; fixes must close the loop with reproducible evidence.
- Monitor test flakiness: two consecutive flaky runs require triage before shipping new features.

## User Experience Consistency
- Keep navigation, forms, and themes consistent across pages; the settings footer and theme switchers behave identically everywhere.
- Use shared design tokens (spacing, color, typography) so new features inherit dark, light, and Catppuccin support without extra work.
- Validate inputs inline with clear error copy and recovery guidance; avoid server-only validation surprises.
- Document UX flows (POS checkout, returns, transfers) and update them with every change so support can mirror the experience.

## Performance Requirements
- POS interactions commit within 250 ms in the local network path; fall back gracefully if Supabase latency spikes.
- Dashboard KPIs and charts hydrate under 1 s with cached summaries; live updates stream via lightweight diffs.
- Keep bundle size lean: lazy-load admin-only modules, and audit dependencies quarterly.
- Instrument API timing, DB query counts, and realtime fan-out; alert when thresholds drift beyond ±15 % of baseline.