# Quickstart — Basic Admin Settings

## Prerequisites
- Node 20 LTS with corepack-enabled PNPM or npm (project currently uses npm lockfile).
- Supabase project configured; required env vars in `.env.local`:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL` (Postgres connection used by Prisma)
- Existing migration history applied (`npm run db:migrate`).

## Database Schema Changes
1. Add new Prisma models (`BusinessProfile`, `OperationalPreference`, `NotificationPreference`, `NotificationRecipient`, `StaffInvitation`, `SettingsAuditLog`) and extend `UserShop` with `status`, `deactivatedAt`, `deactivatedBy`.
2. Generate and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
3. Seed default settings for existing shops (script will:
   - create baseline `BusinessProfile` using shop name
   - insert default `OperationalPreference` (EUR, `Europe/Berlin`, `metric`, Monday fiscal start)
   - seed notification preferences (all enabled, email channel)).

## Local Development
1. Start Astro dev server with environment overrides:
   ```bash
   npm run dev
   ```
2. Navigate to `/settings` (route to be introduced) and sign in with an Owner account.
3. Verify live update behaviour:
   - Aktualisiere das Geschäftsprofil (Name, Adresse, Kontakt) und prüfe, dass Dashboard/Belege die neuen Werte zeigen.
   - Stelle Währung & Zeitzone um und kontrolliere, dass Berichte/Timestamps aktualisiert werden.
   - Passe Benachrichtigungskategorien an, füge Empfänger hinzu/entferne sie und bestätige die Änderung in der UI.
   - Lade das Audit-Log und stelle sicher, dass jede Änderung (Profil, Betrieb, Team) mit Zeitstempel protokolliert wurde.
   - Versende eine Teameinladung, ändere die Rolle und deaktiviere den Account, um den kompletten Lebenszyklus zu testen (erfordert Supabase Service Role).

## Testing Strategy
- Unit tests: add coverage for validation and service functions under `tests/unit/settings`.
- Contract tests: encode API expectations in `tests/contracts/settings.*.test.ts` und ausführen mit:
  ```bash
  npm run test:contracts
  ```
- Integration tests: simulate invite → accept → deactivate happy path in `tests/integration/settings-staff.test.ts`.

## Operational Checks
- Standardmäßig Supabase Service Role (`SUPABASE_SERVICE_ROLE_KEY`) setzen, damit Einladungen/Deaktivierungen funktionieren.
- Audit-Log-Einträge via `GET /api/settings/audit` kontrollieren (Filter optional per `section` & `limit` Parameter).
- Bei parallelen Formularen Version-Konflikte auslösen (z.B. zwei Tabs) und sicherstellen, dass die UI eine verständliche Meldung zeigt.
