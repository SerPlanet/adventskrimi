# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-04 · Redesign beschlossen (D74–D83), **WP20 und WP21 erledigt**. **Nächstes Work Package: WP22.** Danach WP23 → WP13 Teil 2 (Menschen-Test) → WP14 (Launch). Code-Freeze 29.11., Start 1.12.

## Nächste Work Packages
| WP | Inhalt | Datei |
|---|---|---|
| WP22 | Inhalt Tag 1–5 (Sub-Agent), danach `insights.yaml`/`routes.yaml` für Berghotel | `docs/wp/WP22-inhalt-tag1-5.md` |
| WP23 | Inhalt ab Tag 6 (Sub-Agent) | `docs/wp/WP23-inhalt-ab-tag6.md` |

## Erledigt (Kurzform, Details in `git log` und den WP-Dateien)
- WP00–WP12, WP15–WP19: Engine, Schemas, Solver, Validator, Simulator, Edge Functions, Frontend, Rätsel, Raster, Zeitstrahl, Zeugnis, Anklage, Erkunden-Kern, Akte, Dialog, Schlösser, Zeitung, Verwaltung, A11y, `knip`.
- WP13 Teil 1: `npm run timelapse` (beide Profile × 1/2/4/20 Spieler) ohne Fehler. `balance` grün, Lösetag 20.
- WP21: Gute-Nacht-Screen (`GoodNight`), „Zum nächsten Tag“ → Erzähltext → Zeitung, Späträtsel mit Faktor („zählt 75 %“), EndDay ohne Raumliste auf geführten Tagen, Rollenwahl (`RoleCard`, Einstellung `role`), Plan und Orte nur mit eigenem Weg, `movement` entfernt (D82). Playwright (13), Lighthouse 100 grün; Browser-Abnahme Tag 1, Tag 2, Nachholer auf Staging (`_test`).
- WP20: Erkenntnisse (`insights.yaml`, `supports`), Flure (`routes.yaml`, reihum, geführte Tage), `Source.route`/`unlock`, `actions_by_day`, Späträtsel-Faktor, `roles` im Profil, Validator `insights` (Regeln 1–8), Solver mit Flur. Test nur mit `cases/_test`.

## Wochenplan bis zum Freeze (29.11.)
- 9.–15.11. WP21 (Haupt-Agent), WP22 als Sub-Agent in `cases/`. · 16.–22.11. WP23 (Sub-Agent), Validator und `balance` grün, Mensch spielt Tag 1–10 an.
- 23.–28.11. WP13 Teil 2 (Menschen-Test, Nachregeln), WP14 Launch-Vorbereitung. · 29.11. Freeze (Code; Inhalte ab Tag 15 dürfen nachkommen, D80).
- **Ehrlich:** Engine/UI und Inhalt Tag 1–14 sind realistisch. Tag 15–24 werden eher dünn. Ein Menschen-Test bleibt bei einem Durchlauf.
- **Streichliste (zuerst oben):** 1. Rollenwahl-Karte (nur Standardrolle) 2. Zufallsstichprobe (Regel 7) und Späträtsel-Anzeige 3. Verdächtige 7→5, Erkenntnisse ~12→9, Belege 3–4→2–3 4. Dinge je Raum 5→4 ab Tag 15, Zeitung ab Tag 15 mit Klatsch-Bausteinen 5. Notizbuch-Skin, „Ansehen“-Kommentare nur Tag 1–10. Nie streichen: Gute-Nacht-Screen, Tag 1–5, Validator-Regeln 1–4 und 6.

## Bekannt
- Ein Spiel kopiert Profil und Punkte beim Anlegen (D64): nach Änderungen an `config/` (z. B. `actions_by_day`, `newspaper_puzzle_late_factor`) Staging-Spiele neu anlegen.
- Berghotel hat noch kein `insights.yaml`/`routes.yaml` (D81): keine geführten Tage, Validator `insights` übersprungen. `balance` ist grün, rechnet aber noch mit dem alten Fall (Budget Tag 4–5 jetzt 2 statt 3). Neu kalibrieren erst nach WP22/WP23.
- `balance` Freunde ist rot seit D82 (freie Bewegung, worst-Bot Berghotel). Neu kalibrieren in WP23.
- **Staging-Spiele `freunde` und `familie` haben noch den alten Profil-Snapshot (ohne `actions_by_day`, `roles`): sie laufen mit den deployten Functions nicht, bis ihr `config` neu geschrieben wird (D64). Die Änderung wurde mir verweigert; siehe „Mensch“.**
- `test:int` hat keine Testdateien mehr (seit WP13); Bundle baut, Functions sind auf Staging deployt (Stand WP21). Staging-Spiel `e2e-wp20` (Fall `test`) ist ein Rest und darf gelöscht werden.
- Prod: Migrationen 0000–0300 angewendet, kein Fall geladen, keine Functions deployt, `SUPABASE_PROD_ANON_KEY` fehlt. Neue Fall-Felder liegen in `case_meta.data`, keine Migration nötig.

## Staging-Spiele (Tests nie in diesen!)
/#/freunde und /#/familie: „Detektiv A“, „Detektiv B“, „Tag 6“ plus Altspieler. Datum fälschen: `?now=2026-12-24T12:00:00+01:00`. Zurücksetzen: `npm run reset-player -- <slug> "<Name>" <Tag>`. Playwright/Lighthouse nutzen `e2e-*`.

## Mensch (kann kein Agent tun)
- [ ] Staging: `config` der Spiele `freunde` und `familie` neu schreiben (Profil und Scoring aus `config/` laden, wie `create-game`), sonst sind sie kaputt. Oder die Spiele neu anlegen.
- [ ] Spieler-Namen, Profilwahl und Rollen bereitstellen (WP14)
- [ ] Prod: `SUPABASE_PROD_ANON_KEY` in `.env`, Fall laden, Functions deployen, Spiele anlegen (WP14)
- [ ] Domain/Link verteilen; Namen in `insider.yaml`; ab 16.11. Tag 1–10 selbst durchspielen
