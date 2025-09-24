
# ♉ Inventauri v2 – Astro + Supabase + Shadcn UI + Prisma

## Specification

Inventauri v2 is a lightweight web-based inventory system for micro-shops, featuring:
- Item management
- Stock tracking
- Simple sales insights

**End project requirement:** The application must be executable via a Docker Compose file, enabling easy deployment and local development with all dependencies (app and database) managed as containers.

![Inventauri v2 - Landing Page](./src/assets/landing_page.png)

...existing code...

## 🔧 Quickstart

1. Start Supabase locally (e.g. via the [Supabase CLI](https://supabase.com/docs/guides/cli/local-development)) or point the project at your existing instance.
   ```bash
   supabase start
   ```
   > Ensure the Postgres instance is reachable and `DATABASE_URL` points to it (local default: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local` and insert your real values (Supabase keys + `DATABASE_URL`).
   - `.env.local` is ignored by git and stays local-only.

4. Optional: configure default warehouse names in `.env.local`:
   ```ini
   SEED_CENTRAL_NAME="Main Warehouse HQ"
   SEED_CENTRAL_SLUG="central-hq"
   ```

5. Run migrations & seed (all scripts automatically load `.env.local`):
   ```bash
   npm run db:migrate      # applies Prisma migrations
   npm run db:seed         # creates the default central warehouse
   ```

6. Launch the dev server:
   ```bash
   npm run dev
   ```

Astro serves the app on [http://localhost:4321](http://localhost:4321).

## 🗂️ Project Structure

```text
src/
├── components/
│   ├── auth/             # Supabase login/logout helpers
│   ├── dashboard/        # Dashboard widgets & lists
│   ├── items/            # Item list & create form
│   ├── pos/              # POS terminal UI
│   └── ui/               # Shadcn-inspired React primitives
├── layouts/              # App shell
├── lib/
│   ├── api/              # Fetch helpers for authenticated routes
│   ├── auth/             # Cookie/session utilities
│   ├── data/             # Prisma data-access helpers (dashboard, items, POS, warehouses)
│   ├── services/         # Stock mutation services
│   ├── supabase-client.ts
│   └── utils.ts
├── pages/
│   ├── api/              # JSON APIs (stock, items, dashboard)
│   ├── dashboard/
│   ├── inventory/
│   ├── items/
│   ├── pos/
│   └── ...               # Landing, login, etc.
└── styles/
    └── global.css        # Tailwind base & design tokens

prisma/
├── migrations/           # Versioned SQL migrations
├── schema.prisma         # Data model (warehouses, items, transactions)
└── seed.ts               # Seeds default warehouse and demo data

ROADMAP.md                # Backlog / todo list
```

## 🗃️ Data Model (Prisma + Supabase)

- `Warehouse` (`type = central | pos | virtual`) represents HQ and POS locations, identified by `slug`.
- `PosLocation` stores optional POS contact metadata.
- `Item` contains product master data (SKU, barcode, unit, metadata).
- `ItemStockLevel` tracks stock per warehouse (on hand, reserved, reorder/safety thresholds).
- `StockTransaction` records inbound, transfers, sales, adjustments, donations, returns with history.

Row Level Security is currently disabled; once policies are defined you can re-enable it in future migrations (see comments inside the generated SQL).

![Warehouse / POS](./src/assets/warehouse_mngmt.png)

## 🔐 Supabase Auth & Environment Handling

- `PUBLIC_SUPABASE_URL` & `PUBLIC_SUPABASE_ANON_KEY` in `.env.local` feed the browser client (`src/lib/supabase-client.ts`).
- `SUPABASE_SERVICE_ROLE_KEY` is optional (for server tasks only).
- `DATABASE_URL` is consumed by Prisma (all CLI scripts run through `dotenv-cli`).
- `/login` uses Supabase email/password (`signInWithPassword`); logout is in the sidebar.
- Middleware checks the `sb-access-token` cookie and redirects unauthenticated users to `/login`. The client-side `SessionGuard` also keeps cookies & redirects aligned.
- Protected APIs (e.g. `/api/stock/*`, `/api/items`) require a Supabase access token via `Authorization: Bearer <token>`.

## 🔄 Inventory API & UI Interactions

- Stock mutations live under `/api/stock/{inbound|transfer|adjust|sale|writeoff|donation|return}` and return updated inventory snapshots.
- `InventoryManager` (React) performs transfers, adjustments, inbound/outbound bookings and refreshes stock instantly.
- Item history is available via `/api/stock/history`.
- The POS terminal generates sales references; returns accept a reference scan and book items back via `/api/stock/return`.
- New items are created through `/api/items`. The `/items/new` form creates the master record, stores metadata (price/supplier), and optionally books initial stock into a warehouse.

## 🛠️ Useful Scripts

| Command                     | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `npm run dev`              | Start Astro dev server                                       |
| `npm run build`            | Production build                                             |
| `npm run db:generate`      | Generate Prisma client (`dotenv` loads `.env.local`)         |
| `npm run db:migrate`       | Run `prisma migrate dev`                                     |
| `npm run db:migrate:deploy`| Apply migrations without reset (e.g. CI/CD)                  |
| `npm run db:seed`          | Execute `prisma db seed` (creates default warehouse)         |

## ✅ Next Steps

- Define Supabase RLS policies and version them via migrations.
- Add a Supabase Edge Function for atomic transfers (HQ ➜ POS).
- Populate inventory UI with tailored Prisma queries (summaries, filters).
- Build a POS wizard to create new POS warehouses and trigger transfers.

## 📝 TODO / Roadmap

See [ROADMAP.md](./ROADMAP.md) for the current backlog.

Happy building with Inventauri! ♉

![Dashboard](./src/assets/dashboard.png)