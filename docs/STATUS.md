# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-03 · Phase: **UI-Redesign fertig (WP06e–j), Aufräumen WP06i erledigt.** Nächstes: WP11 (Admin) → `docs/wp/WP11-admin.md`.

Reihenfolge: WP00–WP10 ✓ → WP06b–j ✓ → **WP11 Admin** → WP12 A11y/Feinschliff → WP13 Testlauf → WP14 Launch. Code-Freeze 29.11., Start 1.12.

## Erledigt (Kurzform, Details in `git log` und den WP-Dateien)
- Kern: Engine, Schemas, Solver, Validator (10 Prüfungen + `plan`), Simulator mit Bots, Edge Functions, Frontend, Rätsel des Tages, Objekt-Rätsel, Raster, Zeitstrahl, Theorie, Zeugnis, Anklage, Rangliste, Plaketten.
- Erkunden-Kern: Dinge je Raum (Klassen `deko`/`ansehen`/`untersuchbar`), nur „Genauer untersuchen“ kostet 1 Aktion (D62), Dokumente einstecken, Verknüpfen, Lügennetz. Kein „!“.
- UI: Skins je Bereich, ein Grundriss als Hotelplan, komponierte Raumszene (`place` hält jede Hotspot-Mitte frei), Zeitung als Titelseite (Sperre `readableDays`), Akte als Ordner (Personen, Dokumente, Orte, Zeit, Raster), eine feste Leiste (Name, Tag, Punkte, Aktionen, Menü).
- Aufräumen: `knip` in der CI (D63), `normalizeState`, `format: legacy`, Hotspot-Notbehelf und tote CSS entfernt. Zeitraffer Tag 1–24 auf Staging für beide Profile ohne Fehler.
- Berghotel: `validate-case` und `balance` grün (Freunde Budget 4, Familie 3). Lösetag des optimalen Spielers: 20.

## Offen im Inhalt (WP10b-Nacharbeit, später)
- Je Raum/Tag mehr untersuchbare Funde als Aktionen nur in Salon, Küche, Lobby; Tage 1–5 haben fast keine Untersuchen-Funde, Dachboden erst ab Tag 20 (Grenzen und Bots neu kalibrieren, `docs/07`).
- Namen in `insider.yaml`; Stichprobe der Dialogtexte lesen.

## Bekannt
- `tools/integration/api.int.ts` ist veraltet (Test `actions.used`, Altlast „Int-P“): reparieren oder löschen.
- Ein Spiel kopiert Profil und Punkte beim Anlegen (D64): nach Änderungen an `config/` Staging-Spiele neu anlegen.
- Prod: Migrationen 0000–0300 sind angewendet, kein Fall geladen, keine Functions deployt, `SUPABASE_PROD_ANON_KEY` fehlt in `.env`.

## Staging-Spiele
/#/freunde (Mia, Noah Tag 6, Lena, Tom Tag 20) und /#/familie (Oma, Papa Tag 6, Lisa, Jonas Tag 20). Datum fälschen: `?now=2026-12-06T12:00:00+01:00`. Werkzeug: `npm run fast-forward -- <slug> <Name> <Tag>`.

## Mensch (kann kein Agent tun)
- [ ] Spieler-Namen und Profilwahl (Familie/Freunde) bereitstellen (WP14)
- [ ] Prod: `SUPABASE_PROD_ANON_KEY` in `.env`, Fall laden, Functions deployen, Spiele anlegen (WP14)
- [ ] Domain/Link an die Spieler verteilen

## Meilensteine
| ID | Ziel | Datum |
|----|------|-------|
| M3 | Inhalte fertig (Berghotel, beide Profile) | ~24.11. |
| M4 | Testlauf ok (Zeitraffer, Bots, Menschen-Test) | ~28.11. |
| M5 | Launch (Freeze 29.11.) | 1.12. |
