# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-04 · Redesign beschlossen (D74–D83), **WP20, WP21 und WP22 erledigt**. **Nächstes Work Package: WP23.** Danach → WP13 Teil 2 (Menschen-Test) → WP14 (Launch). Code-Freeze 29.11., Start 1.12.

## Nächste Work Packages
| WP | Inhalt | Datei |
|---|---|---|
| WP23 | Inhalt ab Tag 6 (Sub-Agent) | `docs/wp/WP23-inhalt-ab-tag6.md` |

## Erledigt (Kurzform, Details in `git log` und den WP-Dateien)
- WP00–WP12, WP15–WP19: Engine, Schemas, Solver, Validator, Simulator, Edge Functions, Frontend, Rätsel, Raster, Zeitstrahl, Zeugnis, Anklage, Erkunden-Kern, Akte, Dialog, Schlösser, Zeitung, Verwaltung, A11y, `knip`.
- WP13 Teil 1: `npm run timelapse` (beide Profile × 1/2/4/20 Spieler) ohne Fehler. `balance` grün, Lösetag 20.
- WP22: Neuer Fall Berghotel Edelweiß (7 Figuren, 3 Flure, 12 Räume), Lösung lokal festgelegt (nur in `cases/berghotel/`), Tag 1–5 geschrieben (87 Quellen, 10 Erkenntnisse mit 7–10 Belegen, Typ `story`, Dialoge mit Folgefragen und `unlock`). `validate-case` grün für beide Profile (mit `quality.override.json`), Lösetag 17. Backup des alten Falls: `cases/_archiv-berghotel-alt/` (lokal).
- WP22b: Neue Regeln (Beleg je Weg höchstens einmal, Zeitung wiederholt nichts, jede Antwort bringt Neues), 3–4 Belege je Erkenntnis (37 insgesamt), Tag-6-Einstieg (4 Erzählkarten, Skandal-Zeitung mit 5 Artikeln). Override: Stichprobe 0,7 bis WP23.
- WP21: Gute-Nacht-Screen (`GoodNight`), „Zum nächsten Tag“ → Erzähltext → Zeitung, Späträtsel mit Faktor („zählt 75 %“), EndDay ohne Raumliste auf geführten Tagen, Rollenwahl (`RoleCard`, Einstellung `role`), Plan und Orte nur mit eigenem Weg, `movement` entfernt (D82). Playwright (13), Lighthouse 100 grün; Browser-Abnahme Tag 1, Tag 2, Nachholer auf Staging (`_test`).
- WP20: Erkenntnisse (`insights.yaml`, `supports`), Flure (`routes.yaml`, reihum, geführte Tage), `Source.route`/`unlock`, `actions_by_day`, Späträtsel-Faktor, `roles` im Profil, Validator `insights` (Regeln 1–8), Solver mit Flur. Test nur mit `cases/_test`.

## Wochenplan bis zum Freeze (29.11.)
- 9.–15.11. WP21 (Haupt-Agent), WP22 als Sub-Agent in `cases/`. · 16.–22.11. WP23 (Sub-Agent), Validator und `balance` grün, Mensch spielt Tag 1–10 an.
- 23.–28.11. WP13 Teil 2 (Menschen-Test, Nachregeln), WP14 Launch-Vorbereitung. · 29.11. Freeze (Code; Inhalte ab Tag 15 dürfen nachkommen, D80).
- **Ehrlich:** Engine/UI und Inhalt Tag 1–14 sind realistisch. Tag 15–24 werden eher dünn. Ein Menschen-Test bleibt bei einem Durchlauf.
- **Streichliste (zuerst oben):** 1. Rollenwahl-Karte (nur Standardrolle) 2. Zufallsstichprobe (Regel 7) und Späträtsel-Anzeige 3. Verdächtige 7→5, Erkenntnisse ~12→9, Belege 3–4→2–3 4. Dinge je Raum 5→4 ab Tag 15, Zeitung ab Tag 15 mit Klatsch-Bausteinen 5. Notizbuch-Skin, „Ansehen“-Kommentare nur Tag 1–10. Nie streichen: Gute-Nacht-Screen, Tag 1–5, Validator-Regeln 1–4 und 6.

## Bekannt
- Ein Spiel kopiert Profil und Punkte beim Anlegen (D64): nach Änderungen an `config/` (z. B. `actions_by_day`, `newspaper_puzzle_late_factor`) Staging-Spiele neu anlegen.
- `cases/berghotel/quality.override.json` lockert Lügennetz, Tempo-Fenster und Mindestzahlen bis WP23 (D84); `insights.yaml`/`routes.yaml` sind jetzt da, die Optional-Regel (D81) fällt in WP23. `balance` ist rot (Bots finden mit dem Teilfall Tag 1–5 plus Skelett der Tatnacht keine eindeutige Lösung), Neu-Kalibrierung in WP23. Der neue Fall ist noch nicht auf Staging geladen.
- **Staging-Spiele `freunde` und `familie` haben noch den alten Profil-Snapshot (ohne `actions_by_day`, `roles`): sie laufen mit den deployten Functions nicht, bis ihr `config` neu geschrieben wird (D64). Die Änderung wurde mir verweigert; siehe „Mensch“.**
- `test:int` hat keine Testdateien mehr (seit WP13); Bundle baut, Functions sind auf Staging deployt (Stand WP21). Staging-Spiel `e2e-wp20` (Fall `test`) ist ein Rest und darf gelöscht werden.
- Prod: Migrationen 0000–0300 angewendet, kein Fall geladen, keine Functions deployt, `SUPABASE_PROD_ANON_KEY` fehlt. Neue Fall-Felder liegen in `case_meta.data`, keine Migration nötig.

## Staging-Spiele (Tests nie in diesen!)
/#/freunde und /#/familie: „Detektiv A“, „Detektiv B“, „Tag 6“ plus Altspieler. Datum fälschen: `?now=2026-12-24T12:00:00+01:00`. Zurücksetzen: `npm run reset-player -- <slug> "<Name>" <Tag>`. Playwright/Lighthouse nutzen `e2e-*`.

## Mensch (kann kein Agent tun)
- [ ] Staging: `npm run refresh-config -- --slug freunde --yes`, danach dasselbe mit `familie` (schreibt nur `games.config`; ohne `--yes` Vorschau der Felder, prod nur mit `--env prod --yes`).
- [ ] Spieler-Namen, Profilwahl und Rollen bereitstellen (WP14)
- [ ] Prod: `SUPABASE_PROD_ANON_KEY` in `.env`, Fall laden, Functions deployen, Spiele anlegen (WP14)
- [ ] Domain/Link verteilen; Namen in `insider.yaml`; ab 16.11. Tag 1–10 selbst durchspielen
