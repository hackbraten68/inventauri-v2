# TODO

- [ ] Implement roadmap gaps: complete dashboard metrics, POS workflows, admin settings, and resolve listed return-process bugs.
- [ ] Fix Vitest discovery by renaming suites to `*.test.ts` or adjusting `vitest.config.ts`.
- [ ] Restore the missing `docs/` content or update `README.md` links.
- [ ] Validate Prisma migrations with the target environment and confirm the forward-dated schema is usable.
- [ ] Ensure Supabase credentials and seed data are provisioned so dashboards and inventory views populate.

**Project Snapshot**
- Astro + React TypeScript app with Supabase auth, Tailwind UI, Prisma ORM, and Docker-first workflows advertised in the docs (`README.md:1`, `package.json:1`).
- Source split into Astro pages, React components, shared libs, and middleware guarding private routes (`src/pages/index.astro:1`, `src/components/dashboard/DashboardOverview.tsx:1`, `src/middleware.ts:1`).
- Database modeled for multi-tenant inventory: shops, products, variants, warehouses, stock levels, and transactions plus Supabase user mappings (`prisma/schema.prisma:1`).
- Specs directory captures detailed plans, research, and contracts for the core inventory system and a login theming iteration (`specs/001-inventauri-v2-is/plan.md:1`, `specs/002-login-page-dark/spec.md:1`).
- Local dev expects `.env.local` with Supabase keys and Postgres URL; dotenv wrapper is baked into every npm script (`package.json:4`, `tests/setup.ts:1`).

**Implemented Features**
- Public landing page, login screen with Supabase password flow, and theme toggle components already wired up (`src/pages/login.astro:1`, `src/components/auth/LoginForm.tsx:1`).
- Auth middleware and server helpers enforce cookie/Bearer tokens before exposing dashboard, inventory, POS, and API routes (`src/middleware.ts:1`, `src/lib/auth/server.ts:1`).
- Dashboard API & UI aggregate stock KPIs, sales summaries, and recent transactions, refreshing in 30-second intervals (`src/pages/dashboard/index.astro:1`, `src/components/dashboard/DashboardOverview.tsx:18`, `src/lib/data/dashboard.ts:1`).
- Inventory page resolves Prisma-backed item snapshots with warehouse breakdowns and passes them to a client-side list component (`src/pages/items/index.astro:1`, `src/lib/data/inventory.ts:1`).
- Product listing endpoint scopes data by the caller’s shop using tenant helpers (`src/pages/api/products/index.ts:1`, `src/lib/tenant.ts:1`).

**Outstanding / Risks**
- ROADMAP highlights unfinished dashboard metrics, POS workflows, admin settings, and known bugs with returns—you’ll need significant work to reach production parity (`ROADMAP.md:1`).
- Vitest config only picks up `*.test.ts`, but current suites omit that suffix, so `npm run test` won’t execute them until filenames align (`vitest.config.ts:1`, `tests/unit/test_theme_service.ts:1`).
- README points to a `docs/` directory that isn’t in the tree, so deployment/API references still have to be written or relocated (`README.md:48`).
- Database migrations are versioned into late-2025 folders, signalling the schema is mid-evolution and may not match any live environment (`prisma/migrations/20250923152218_init_inventory/README.md`).
- Supabase credentials are mandatory for both browser and server calls; without a seeded database (see Prisma seed script) most UI panels will render empty states (`src/lib/supabase-client.ts:1`, `prisma/seed.ts`).
