# ♉ Inventauri Roadmap

## Dashboard & Inventar
- [ ] Konfigurierbare Bestandswarnungen (zentral & POS) inkl. Eingabefelder und Speicherung.
- [ ] Dashboard erweitern: echte Umsatzberechnung, Diagramme (Verlauf, Verteilung), Deep-Links.
- [ ] Echtzeit-Updates via Supabase Realtime für Dashboard, Inventar und POS.

## Einstellungen & Administration
- [ ] Sidebar-Footer mit Settings (Theme ✅, Sprache/i18n, Profil, Logout, Admin-Switch).
- [ ] Admin-Bereich: Organisationsdaten, Benutzer-/Rollenverwaltung, Supabase-Anbindung.
- [ ] Rollen- & Policy-System (Supabase RLS) plus UI-Zugriffsbeschränkungen.

## Artikel & POS
- [ ] Artikel bearbeiten (inkl. Warnschwellen) + erweiterte Detailansichten.
- [ ] POS-Rückgaben: Rückerstattungslogik/Belege, Reporting.
- [ ] Report-Export als CSV und formatiertes PDF.

## Setup & Infrastruktur
- [ ] Installer/Setup-Skript (Blank vs. Sample-Daten, Demo-User) über CLI/Docker.
- [ ] Tests & Monitoring für Services, APIs und kritische Aktionen.

## Flaws gefunden beim Testen
- [ ] Wenn Retoure mit 2 oder mehr Artikel und nur einer wird zurückgegeben, erscheint der andere Artikel ind er Historie als Retoure, obwohl es da kein Retourenbewegung gab.
- [ ] Es muss sichergestellt werden, das der Bestand der zurueckgegeben Waren auf die referenznummer abgespeichert wird. Wenn die ich selbe nummer nochmal eingebe, erscheint der gleiche Bestand wie zu beginn. -. Shadow Bestand
- [ ] 