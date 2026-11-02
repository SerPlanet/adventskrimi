# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-02 · Phase: WP06 fertig, WP07 als Nächstes. Mensch: Prod-Migration, Pages, Namen

## Nächstes Work Package
**WP07** → `docs/wp/WP07-raetsel.md`

Reihenfolge (Details: `docs/08-roadmap.md`):
WP00 ✓ → WP01 ✓ → WP02 ✓ → WP03 ✓ → (WP10 ✓) → WP05 ✓ → WP06 ✓ → WP07 → WP09 → **M1** → WP08 → WP04 → WP11 → WP12 → WP13 → WP14

## Erledigt
- Doku v0.1 (Spielregeln, Punkte, Architektur, Roadmap)
- WP00: Workspaces, TS strict, ESLint/Prettier/Vitest, Hello-App, check-bundle-Stub, CI + Pages-Workflow, Supabase-Config + leere Migration. `npm run lint && npm test && npm run build` grün.
- WP01: Zod-Schemas, Loader mit Referenzprüfung, Migration (27 Tabellen, RLS gesperrt), `load-case`, `validate-schema`, Testfall `cases/_test`, Configs. Auf Staging angewendet und geladen.
- WP02: Solver (Kandidatenraum, Fakt-Auswertung, Tempo-Planer), Profilanwendung, Validator `npm run validate-case -- <fall> --profile <p> [--only <check>]` mit 9 Prüfungen, Mini-Fall-Tests. `_test` besteht beide Profile.
- WP03: Engine-Kern `packages/engine/src/game/` (Aktionen, Bewegung, Tage/Gnadenfrist, Punkte, Zeugnis, Anklage, Widersprüche). Vollständiger 24-Tage-Lauf auf `_test` als Test.
- WP05: Edge Functions (state, open_day, act, end_day, answer_daily, scoreboard, newspaper, settings, admin_players) auf Staging, Integrationstests grün. Spieler anlegen: `admin_players`; Spiel anlegen: `npm run create-game`.
- WP06: Frontend-Kern (Namenswahl per Link `/#/<slug>`, Zeitung, Hotel, Akte, Rangliste, Einstellungen, Page). Playwright-Smoke grün, Lighthouse-A11y 100 auf allen Screens, kein Überlauf bei 360 px und Schrift „sehr groß“.
- WP10: Fall Berghotel (lokal, per .gitignore nicht im Repo) und Familienprofil; `validate-case` grün für friends und family, Tempo Tag 20. Noch offen: `npm run balance` (WP04), Namen in `insider.yaml`.

## In Arbeit
- –

## Blocker / offene Fragen an den Menschen
- Siehe `docs/09-offen-und-entscheidungen.md` (Abschnitt „Offen“)

## Mensch (kann kein Agent tun)
- [x] GitHub: privates Repo `SerPlanet/adventskrimi` angelegt
- [ ] Einmalig `gh auth refresh -s workflow` ausführen (Browser-Login), danach `git push -u origin main`
- [x] Supabase `advent-staging` angelegt, verknüpft, leere Migration angewendet (2026-11-02)
- [x] Supabase `advent-prod` angelegt (2026-11-02), noch ohne Migration
- [x] Repo ist öffentlich, Pages läuft über GitHub Actions (kein Pro nötig)
- [ ] Optional: Repo → Settings → Secrets and variables → Actions → Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon-Key ist öffentlich, kein Service-Key!)
- [ ] Spieler-Namen und Profilwahl (Familie/Freunde) bereitstellen, siehe WP14

## Meilensteine
| ID | Ziel | Datum | Inhalt |
|----|------|-------|--------|
| M1 | Kalender-Light (Fallback) | ~17.11. | Profilwahl, Zeitung, Rätsel des Tages, Rangliste, online |
| M2 | Spielbar mit Testfall | ~21.11. | Aktionen, Fallakte, Raster, Zeitstrahl, Theorie auf `cases/_test` |
| M3 | Inhalte fertig | ~24.11. | Fall Berghotel für beide Profile validiert |
| M4 | Testlauf ok | ~28.11. | Zeitraffer + Bots + Menschen-Test |
| M5 | Launch | 1.12. | Freeze 29.11. |
