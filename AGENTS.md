# inventauri-v2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-23

## Active Technologies
- TypeScript (Node.js 20 runtime) + Astro server routes, Prisma ORM, Supabase-authenticated API handlers, internal validation utilities (005-allow-version-zero)
- PostgreSQL (Prisma-managed tenant settings tables) (005-allow-version-zero)
- TypeScript (Astro 5.x on Node.js 20) + Astro, React islands, Prisma ORM, PocketBase JS/REST client, Docker Compose, Tailwind, Supabase (to be removed) (006-replace-supabase-pocketbase)
- PostgreSQL (Prisma-managed) for inventory data + PocketBase embedded database for auth/users (006-replace-supabase-pocketbase)
- PostgreSQL (Prisma-managed) for inventory data + PocketBase embedded DB for auth/users (006-replace-supabase-pocketbase)
- TypeScript (Astro 5.x, React islands) on Node.js 20 LTS + Astro server routes, React, Prisma ORM, PocketBase JS SDK, Docker Compose, Tailwind CSS, Vitest, Supabase (legacy, being removed) (006-replace-supabase-pocketbase)
- PostgreSQL 15 (Prisma-managed) for inventory + PocketBase embedded DB for auth/users (seeded via `pocketbase/pb_migrations`) (006-replace-supabase-pocketbase)

- TypeScript (Astro 5.x on Node 20 LTS) + Astro + React islands, Prisma ORM, Supabase JS SDK, Tailwind design system (004-add-admin-settings)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript (Astro 5.x on Node 20 LTS): Follow standard conventions

## Recent Changes
- 006-replace-supabase-pocketbase: Added TypeScript (Astro 5.x, React islands) on Node.js 20 LTS + Astro server routes, React, Prisma ORM, PocketBase JS SDK, Docker Compose, Tailwind CSS, Vitest, Supabase (legacy, being removed)
- 006-replace-supabase-pocketbase: Added TypeScript (Astro 5.x on Node.js 20) + Astro, React islands, Prisma ORM, PocketBase JS/REST client, Docker Compose, Tailwind, Supabase (to be removed)
- 006-replace-supabase-pocketbase: Added TypeScript (Astro 5.x on Node.js 20) + Astro, React islands, Prisma ORM, PocketBase JS/REST client, Docker Compose, Tailwind, Supabase (to be removed)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
