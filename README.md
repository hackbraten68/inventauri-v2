# Inventauri v2 – Astro + Supabase + Shadcn UI + Prisma

Dieses Setup liefert ein startfertiges Astro-Projekt mit Supabase-Anbindung, React-Komponenten im Shadcn-Stil sowie einer Prisma-Datenbankstruktur für Lager, Artikel und Bewegungen.

## 🔧 Schnellstart

1. Supabase lokal starten (z.B. [Supabase CLI](https://supabase.com/docs/guides/cli/local-development)) oder auf dein bestehendes Projekt verweisen.
   ```bash
   supabase start
   ```
   > Stelle sicher, dass die Postgres-Instanz erreichbar ist und `DATABASE_URL` darauf zeigt (Standard lokal: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Environment-Datei anlegen:
   - Kopiere `.env.example` zu `.env.local` und hinterlege deine echten Werte (Supabase Keys + `DATABASE_URL`).
   - `.env.local` ist in `.gitignore` eingetragen und wird nicht versioniert.
4. Optional zentrale Lager-Defaults setzen (ebenfalls in `.env.local`):
   ```ini
   SEED_CENTRAL_NAME="Hauptlager HQ"
   SEED_CENTRAL_SLUG="central-hq"
   ```
5. Datenbank migrieren & Seed ausführen (alle Scripts laden automatisch `.env.local`):
   ```bash
   npm run db:migrate      # erstellt/aktualisiert Tabellen via Prisma
   npm run db:seed         # legt das standard Hauptlager an
   ```
6. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

Der Astro-Server läuft anschließend unter [http://localhost:4321](http://localhost:4321).

## 🗂️ Projektüberblick

```text
src/
├── components/
│   ├── auth/             # Login/Logout Komponenten mit Supabase
│   └── ui/               # Shadcn UI-Basiskomponenten (React)
├── layouts/
│   └── AppLayout.astro   # App-Shell mit Navigation & Logout
├── lib/
│   ├── supabase-client.ts
│   ├── supabase-admin.ts
│   └── utils.ts
├── pages/                # Landing, Login, Dashboard, Inventory, POS, Items
└── styles/global.css      # Tailwind & Design Tokens

prisma/
├── migrations/           # Versionierte SQL-Migrationen (Postgres/Supabase)
├── schema.prisma         # Datenmodell (Warehouses, Items, Transaktionen)
└── seed.ts               # Legt das Standard-Hauptlager an
```

## 🗃️ Datenmodell (Prisma + Supabase)

- `Warehouse` (`type = central | pos | virtual`) verwaltet HQ und POS-Lager, `slug` identifiziert jedes Lager eindeutig.
- `PosLocation` erweitert POS-Lager um optionale Kontaktdaten.
- `Item` repräsentiert Produkte (SKU, Barcode, Einheit, Metadaten).
- `ItemStockLevel` hält Bestände je Lager (on hand, reserved, reorder/safety stock).
- `StockTransaction` protokolliert Einbuchungen, Umbuchungen, Verkäufe und Korrekturen mit Historie.

Die initiale Migration (`prisma/migrations/*_init_inventory/`) erzeugt Tabellen & Enums. Row Level Security bleibt bewusst deaktiviert; sobald Policies definiert sind, können die auskommentierten `ENABLE ROW LEVEL SECURITY`-Statements reaktiviert werden.

## 🔐 Supabase Auth & Env Handling

- `PUBLIC_SUPABASE_URL` & `PUBLIC_SUPABASE_ANON_KEY` in `.env.local` versorgen den Browser-Client (`src/lib/supabase-client.ts`).
- `SUPABASE_SERVICE_ROLE_KEY` ist optional, nur für serverseitige Tasks gedacht.
- `DATABASE_URL` in `.env.local` dient Prisma für Migrationen/Seed (`dotenv-cli` lädt die Werte für alle `dev/build/preview/db` Skripte).
- Login über `/login` nutzt Supabase Email/Passwort (`signInWithPassword`). Logout befindet sich in der Sidebar.
- Auth-Guards: Middleware prüft das `sb-access-token`-Cookie und leitet nicht eingeloggte Nutzer auf `/login` um. Zusätzlich sichert ein `SessionGuard`-Client-Component alle App-Layouts ab.
- Geschützte API-Routen (`/api/stock/*`) verlangen ein Supabase Access Token im `Authorization: Bearer <token>` Header.

## 🔄 Bestands-API & UI-Interaktion

- Stock-Mutationen stehen unter `/api/stock/{inbound|transfer|adjust|sale|writeoff|donation|return}` zur Verfügung und liefern neben der Transaktion auch eine aktualisierte Inventar-Snapshot-Struktur.
- Der Inventar-Screen nutzt `InventoryManager` (React) um Aktionen wie Umbuchung, Ein-/Ausbuchung, Korrekturen etc. direkt auszuführen und anschließend den neuen Snapshot zu rendern.
- Warenhistorie pro Artikel wird über `/api/stock/history` geladen.
- POS-Terminal erzeugt pro Verkauf eine Referenznummer. Rückgaben laufen über die Eingabe/den Scan der Referenz und buchen mit `/api/stock/return` automatisch in den Lagerbestand zurück.
- Neue Artikel können über `/api/items` angelegt werden. Das Formular unter `/items/new` legt den Stammsatz an, schreibt optionale Metadaten (Preis/Lieferant) und bucht einen Startbestand ins ausgewählte Lager.

## 🛠️ Nützliche Skripte

| Befehl                     | Zweck                                                        |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Startet Astro Dev-Server                                      |
| `npm run build`            | Produktions-Build                                             |
| `npm run db:generate`      | Prisma Client generieren (`dotenv` lädt `.env.local`)         |
| `npm run db:migrate`       | `prisma migrate dev` (Entwicklung)                            |
| `npm run db:migrate:deploy`| Migrationen ohne Reset ausrollen (z.B. CI/CD)                 |
| `npm run db:seed`          | `prisma db seed` (legt Hauptlager an)                        |

## ✅ Nächste Schritte

- Supabase RLS-Policies definieren und in neuen Migrationen versionieren.
- Edge Function für atomare Umbuchungen (Zentrallager ➜ POS) schreiben.
- Inventar-UI mit Prisma-Abfragen befüllen (z.B. Gesamtsummen + Lagerverteilung).
- POS-Wizard ergänzen, der neue Lager (`Warehouse` + `PosLocation`) erstellt und Umbuchungen triggert.

## 📝 TODO / Roadmap

- Konfigurierbare Bestandswarnungen (zentral & POS) inkl. Eingabefelder, Speicherung und Anzeige im Dashboard.
- Dashboard ausbauen: echte Umsatzberechnung, Diagramme (Verlauf/Verteilung), Deep-Links zu Detailseiten.
- Echtzeit-Updates via Supabase Realtime (Dashboard, Inventar, POS) statt Polling.
- Sidebar-Settings-Footer (Theme, Sprache/i18n, Profil, Logout, Admin-Switch); Admin-Bereich für Organisation, Benutzer & Rollen.
- Rollen- & Berechtigungssystem mit Supabase Policies und UI-Anpassungen.
- Artikel bearbeiten (inkl. Warnschwellen) & erweiterte Detailansicht.
- POS-Rückgaben um Rückerstattungslogik/Belegausgabe erweitern.
- Report-Export als CSV & formatiertes PDF.
- Installer/Setup-Skript (CLI oder Docker) inkl. Option für Blank- vs. Sample-Daten und automatischem Demo-User.
Viel Erfolg beim Ausbau deiner Inventariums-App! 🚀
