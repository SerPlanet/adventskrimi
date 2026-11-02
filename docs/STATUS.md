# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-02 · Phase: **M2 erreicht** (Testfall bis Tag 24 im Zeitraffer, WP08, WP09 Teil 2, WP04 fertig). Offen: Push, Prod-Migration, WP11

## Nächstes Work Package
**M2 erreicht.** Nächstes: WP11 (Admin) → `docs/wp/WP11-admin.md`; parallel Balance-Verstöße aus `npm run balance` (siehe unten) in WP10/WP13 beheben.

Reihenfolge (Details: `docs/08-roadmap.md`):
WP00 ✓ → WP01 ✓ → WP02 ✓ → WP03 ✓ → (WP10 ✓) → WP05 ✓ → WP06 ✓ → WP07 ✓ → WP09 (Teil 1 ✓) → **M1** ✓ → WP08 ✓ → WP09 Teil 2 ✓ → WP04 ✓ → **M2** ✓ → WP11 → WP12 → WP13 → WP14

## Erledigt
- Doku v0.1 (Spielregeln, Punkte, Architektur, Roadmap)
- WP00: Workspaces, TS strict, ESLint/Prettier/Vitest, Hello-App, check-bundle-Stub, CI + Pages-Workflow, Supabase-Config + leere Migration. `npm run lint && npm test && npm run build` grün.
- WP01: Zod-Schemas, Loader mit Referenzprüfung, Migration (27 Tabellen, RLS gesperrt), `load-case`, `validate-schema`, Testfall `cases/_test`, Configs. Auf Staging angewendet und geladen.
- WP02: Solver (Kandidatenraum, Fakt-Auswertung, Tempo-Planer), Profilanwendung, Validator `npm run validate-case -- <fall> --profile <p> [--only <check>]` mit 9 Prüfungen, Mini-Fall-Tests. `_test` besteht beide Profile.
- WP03: Engine-Kern `packages/engine/src/game/` (Aktionen, Bewegung, Tage/Gnadenfrist, Punkte, Zeugnis, Anklage, Widersprüche). Vollständiger 24-Tage-Lauf auf `_test` als Test.
- WP05: Edge Functions (state, open_day, act, end_day, answer_daily, scoreboard, newspaper, settings, admin_players) auf Staging, Integrationstests grün. Spieler anlegen: `admin_players`; Spiel anlegen: `npm run create-game`.
- WP06: Frontend-Kern (Namenswahl per Link `/#/<slug>`, Zeitung, Hotel, Akte, Rangliste, Einstellungen, Page). Playwright-Smoke grün, Lighthouse-A11y 100 auf allen Screens, kein Überlauf bei 360 px und Schrift „sehr groß“.
- WP07: Rätsel des Tages (4 Arten × 3 Stufen, deterministisch, serverseitig geprüft, Tipp-Leiter, Überspringen) und Objekt-Rätsel (Endpunkt `object_puzzle`). Playwright-Smoke deckt beide ab, Lighthouse 100.
- WP09 Teil 1: Rangliste mit Plaketten-Sammlung, „Meine Punkte“ (Aufschlüsselung), Ermittler des Tages in der Zeitung.
- WP10: Fall Berghotel (lokal, per .gitignore nicht im Repo) und Familienprofil; `validate-case` grün für friends und family, Tempo Tag 20. Noch offen: `npm run balance` (WP04), Namen in `insider.yaml`.
- WP08: Raster (Auto/Halb/Manuell), Zeitstrahl (Tippen, Widersprüche aus eigenen Einträgen, „Passt das zusammen?“), Theorie mit Verlauf, serverseitig pro Spieler. Neue Functions `set_note`, `fits`, `set_theory`, `get_theory`. Playwright + Lighthouse 100 (inkl. Theorie).
- WP09 Teil 2: Wochenzeugnis (beim Tagesende, einmalig, Inspektor-Satz nach Trefferzahl), Anklage (`accuse`, ab Tag 20, Bestätigung, endgültig), Frühbonus nur pünktlich, Zeitungsnotiz, Auflösung (`story`) nur nach Abgabe und ab echtem Tag 24. Nicht gebaut: Admin-Knopf Zeugnis, „Gemeinsames Finale“ (WP11).
- Fix: alte Spielerstände ohne neue Felder (z. B. `daily`) führten zu HTTP 500; `normalizeState` beim Laden.
- WP04: `packages/engine/src/sim` (Bots optimal/greedy/random/newspaper_only/worst auf der echten Engine), `npm run simulate -- <fall> --profile <p> [--bot] [--seeds] [--json]`, `npm run balance [-- <fall>]` (07 §5). Test `timelapse.test.ts`: Testfall Tag 1–24 über die API bis zur Auflösung. Laufzeit alle Bots <1 s.
- Balance auf Berghotel (Stand heute, Verstöße für WP10/WP13): newspaper_only und random liegen über dem Boden (Wer 8/5 statt ≤3, Komplize 7), greedy wird bis Tag 24 nicht eindeutig (Freunde), optimal/greedy/worst haben späte Tage ohne neue Funde (ab Tag 18–20, teils Grenze des Bots).

## In Arbeit
- **WP06b (halb fertig, nicht gepusht):** Neu: `app/src/ui/` (Popup, Candles, HotelMap, RoomScene, Bubbles), `screens/EndDay.tsx`, neues Hotel, Zeitungs-Layout, Schema-Felder (`floor/col/scene`, `spot`, `presentation/lines/note`), Popup-Wortprüfung. Functions auf Staging neu deployt. **Offen:** `e2e/smoke.spec.ts` bricht nach dem Fund-Popup ab (das Popup „Neu in deiner Akte" bleibt offen und blockiert den Klick auf „Akte"; im Test vor dem Wechsel `Escape` drücken), danach Lighthouse (`npm run a11y`, Preview muss laufen) und Playwright für Dialog/Notiz/Karte ergänzen.
- **WP06b:** fertig bis auf Berghotel-Inhalte. Playwright (3 Tests inkl. Dialog-Sprechblasen und Notiz-Zettel) grün, Lighthouse A11y 100 auf allen Screens. Ursache des unzuverlässigen Tests: Verbindungs-Slots der Datenbank waren erschöpft (jede Function-Instanz hielt bis zu 3 Verbindungen, Fall-Laden innerhalb der Transaktion brauchte eine zweite). Behoben: max 1 Verbindung je Instanz, Fall-Laden über die Transaktion. Kein Lost Update (Spielerzeile wird mit FOR UPDATE gesperrt); Integrationstest mit parallelen Anfragen ergänzt.
- **Berghotel-Präsentation OFFEN:** Prüfung der Fall-Dateien: 150 Quellen (talk 49, inspect 80, use 2, hotelbook 14, newspaper 5), **keine** hat presentation/lines/note; 9 Räume ohne floor/col/scene, 55 Objekte ohne spot. Balance und validate-case sind grün, aber das Format aus docs/04 §5 fehlt noch ganz. Die UI fällt dafür auf Klartext und gleichmäßig verteilte Hotspots zurück. Nächster Schritt: gezielt nachtragen (WP10-Nacharbeit).
- **Balance (D48):** Bot `casual` und neue Grenzen (random ≤3, casual ≤4, worst ≤4, newspaper_only ohne Ziel) sind in Engine, `config/quality.json` und `npm run balance`. Sub-Agent repariert `cases/berghotel` (Balance + Präsentationsformat). Ergebnis noch nicht geprüft: `npm run validate-case -- cases/berghotel --profile friends|family` und `npm run balance` ausführen. Lose Datei `tools/_dbg.ts` (vom Sub-Agent) löschen, sonst schlägt `npm run lint` fehl.
- Prod: Migrationen 0000–0300 sind auf advent-prod angewendet (per db-url, ohne Umverknüpfung). Es wurde kein Fall geladen und keine Functions deployt. Es fehlt SUPABASE_PROD_ANON_KEY in .env.

## Blocker / offene Fragen an den Menschen
- Siehe `docs/09-offen-und-entscheidungen.md` (Abschnitt „Offen“)

## Mensch (kann kein Agent tun)
- [x] GitHub: privates Repo `SerPlanet/adventskrimi` angelegt
- [ ] Einmalig `gh auth refresh -s workflow` ausführen (Browser-Login), danach `git push -u origin main`
- [x] Supabase `advent-staging` angelegt, verknüpft, leere Migration angewendet (2026-11-02)
- [x] Supabase `advent-prod` angelegt (2026-11-02), noch ohne Migration
- [x] Repo ist öffentlich, Pages läuft über GitHub Actions (kein Pro nötig)
- [x] Repo-Variablen gesetzt: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon-Key ist öffentlich, kein Service-Key!)
- [ ] Spieler-Namen und Profilwahl (Familie/Freunde) bereitstellen, siehe WP14

## Meilensteine
| ID | Ziel | Datum | Inhalt |
|----|------|-------|--------|
| M1 | Kalender-Light (Fallback) | ~17.11. | Profilwahl, Zeitung, Rätsel des Tages, Rangliste, online |
| M2 | Spielbar mit Testfall | ~21.11. | Aktionen, Fallakte, Raster, Zeitstrahl, Theorie auf `cases/_test` |
| M3 | Inhalte fertig | ~24.11. | Fall Berghotel für beide Profile validiert |
| M4 | Testlauf ok | ~28.11. | Zeitraffer + Bots + Menschen-Test |
| M5 | Launch | 1.12. | Freeze 29.11. |
