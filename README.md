# Inventauri — Next.js + Prisma Starter


## Prereqs
- Node 18+
- Docker (for Postgres)


## Setup
1. `cp .env.example .env`
2. `docker compose up -d`
3. `pnpm i` (or `npm i`)
4. `pnpm prisma:generate`
5. `pnpm prisma:migrate`
6. `pnpm dev` → http://localhost:3000


## Notes
- The app uses a fixed `ORG_ID` for now (`DEMO_ORG_ID=demo`). Later we wire auth and real orgs/memberships.
- Use `pnpm prisma:studio` to inspect/edit data visually.


## Next steps
- Add auth (NextAuth) and create default Org on first sign-in.
- Add ABC analysis util + dashboard charts.
- Add barcode scanning (`@zxing/browser`) + PWA.
- CSV import/export.