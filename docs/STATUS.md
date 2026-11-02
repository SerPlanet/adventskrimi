# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-02 · Phase: WP00 Code fertig, wartet auf Menschen-Schritte (Staging/Pages)

## Nächstes Work Package
**WP01** → `docs/wp/WP01-*.md` (WP00 ist code-seitig fertig; offen sind nur die Abnahmepunkte „Staging-URL“ und „Migration auf Staging“, siehe „Mensch“)

Reihenfolge (Details: `docs/08-roadmap.md`):
WP00 → WP01 → WP02 → WP03 → (WP10 als Sub-Agent parallel) → WP05 → WP06 → WP07 → WP09 → **M1** → WP08 → WP04 → WP11 → WP12 → WP13 → WP14

## Erledigt
- Doku v0.1 (Spielregeln, Punkte, Architektur, Roadmap)
- WP00: Workspaces, TS strict, ESLint/Prettier/Vitest, Hello-App, check-bundle-Stub, CI + Pages-Workflow, Supabase-Config + leere Migration. `npm run lint && npm test && npm run build` grün.

## In Arbeit
- –

## Blocker / offene Fragen an den Menschen
- Siehe `docs/09-offen-und-entscheidungen.md` (Abschnitt „Offen“)

## Mensch (kann kein Agent tun)
- [x] GitHub: privates Repo `SerPlanet/adventskrimi` angelegt
- [ ] Einmalig `gh auth refresh -s workflow` ausführen (Browser-Login), danach `git push -u origin main`
- [x] Supabase `advent-staging` angelegt, verknüpft, leere Migration angewendet (2026-11-02)
- [ ] Supabase `advent-prod`: Free-Limit (2 Projekte) erreicht. Vor Launch: Projekt „SerPlanet's Project“ löschen/pausieren oder Pro buchen, dann Agent bitten, prod anzulegen
- [ ] GitHub Pro über das Student Developer Pack aktivieren, dann Repo → Settings → Pages → Source „GitHub Actions“; danach Actions → „Deploy Pages“ → Run workflow (Abnahme „Staging-URL“)
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
