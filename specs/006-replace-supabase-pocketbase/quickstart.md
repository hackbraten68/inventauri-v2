# Quickstart – PocketBase & Dockerized Inventauri

## Prerequisites
1. Docker Desktop or Docker Engine 24+ with Compose v2.
2. Node.js 20 + npm (only required for local builds/tests outside Docker).
3. Copy `.env.example` → `.env.local` for classic workflows AND create `.env.docker` with:
   ```ini
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/inventauri
   POCKETBASE_ADMIN_EMAIL=admin@inventauri.local
   POCKETBASE_ADMIN_PASSWORD=<16+ char secret>
   PUBLIC_POCKETBASE_URL=http://localhost:8090
   ```

## Initial Setup
1. Build the multi-stage web image once:
   ```bash
   docker compose build web
   ```
2. Start the stack:
   ```bash
   docker compose up pocketbase postgres -d
   docker compose run --rm web npm run db:migrate
   docker compose run --rm web npm run db:seed
   docker compose up web
   ```
3. Visit `http://localhost:4321` (Astro app) and `http://localhost:8090/_` (PocketBase admin UI). Log in with the admin credentials from `.env.docker` and create staff accounts linked to Prisma `userShop` rows (see migration notes).

## Everyday Development Loop
1. `docker compose up` to run all services with live reload (the `web` container mounts the repo for hot reloading via `npm run dev`).
2. Edit TypeScript/Prisma files locally; the dev server inside the container restarts automatically.
3. Run tests in Docker to ensure parity:
   ```bash
   docker compose run --rm web npm test
   ```
4. Run lint (optional):
   ```bash
   docker compose run --rm web npm run lint
   ```

## Environment & Secrets
- `.env.local` remains for non-Docker workflows; `.env.docker` is referenced by Compose using the `env_file` directive.
- PocketBase data persists in the `inventauri_pb_data` and `inventauri_pb_public` named volumes; remove them with `docker volume rm` only when you intentionally reset auth data.
- Postgres persists in the `inventauri_pg` volume; to inspect data locally, run `docker compose exec postgres psql -U postgres`.

## Shutdown & Cleanup
```bash
docker compose down           # stop containers, keep volumes
docker compose down -v        # drop data volumes (use with caution)
```
