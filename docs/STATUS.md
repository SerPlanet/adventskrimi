# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-03 · WP15–WP19 und Aufräumen (WP06i) erledigt. Nächstes: WP11 (Admin) → `docs/wp/WP11-admin.md`, dann WP12, WP13, WP14.

Reihenfolge: WP00–WP10 ✓ → WP06b–j ✓ → **WP11 Admin** → WP12 A11y/Feinschliff → WP13 Testlauf → WP14 Launch. Code-Freeze 29.11., Start 1.12.

## Erledigt (Kurzform, Details in `git log` und den WP-Dateien)
- Kern: Engine, Schemas, Solver, Validator (10 Prüfungen + `plan`), Simulator mit Bots, Edge Functions, Frontend, Rätsel des Tages, Objekt-Rätsel, Raster, Zeitstrahl, Theorie, Zeugnis, Anklage, Rangliste, Plaketten.
- Erkunden-Kern: Dinge je Raum (Klassen `deko`/`ansehen`/`untersuchbar`), nur „Genauer untersuchen“ kostet 1 Aktion (D62), Dokumente einstecken, Verknüpfen, Lügennetz. Kein „!“.
- UI: Skins je Bereich, ein Grundriss als Hotelplan, komponierte Raumszene (`place` hält jede Hotspot-Mitte frei), Zeitung als Titelseite (Sperre `readableDays`), Akte als Ordner (Personen, Dokumente, Orte, Zeit, Raster), eine feste Leiste (Name, Tag, Punkte, Aktionen, Menü).
- Aufräumen: `knip` in der CI (D63), `normalizeState`, `format: legacy`, Hotspot-Notbehelf und tote CSS entfernt. Zeitraffer Tag 1–24 auf Staging für beide Profile ohne Fehler.
- Berghotel: `validate-case` und `balance` grün (Freunde Budget 4, Familie 3). Lösetag des optimalen Spielers: 20.

- WP15: Erzähltext (`game/narrative.ts`, `screens/Intro.tsx`), Reiter „Tag“ mit Ort, Personen im Raum und Statuschip, Seite bleibt nach „Tag beenden“ (`ended`, `day_over`), „Rätsel im Raum“ samt `view.puzzles` entfernt (Schlösser kommen mit WP18).

- WP16: Akte nur mit Eingelegtem (`game/file.ts`, Endpunkte `file_add`/`file_remove`, Reiter Personen/Dokumente/Orte/Zeit/Raster/Verlauf), „In die Akte legen“ an Artikeln und Antworten, Zeitstrahl als Tabelle (`set_note` kind `cell`). Gelöscht: Verknüpfen, Déjà-vu, Notizstufen, `fits`, Widerspruchs-Markierung, `scoring.link`, `puzzle_level`. Zeitung liefert `articles` (Lead, Klatsch, Fall-Artikel).

- WP17: Gespräche wie im Videospiel (`ui/Dialog.tsx`, `game/dialog.ts`): Tippen auf eine Person öffnet den Dialog, jede Frage hat eine Antwort („Dazu weiß ich nichts.“), Zeigen eines Gegenstands, „In die Akte legen“ je Antwort. Validator: jedes Thema hat eine Gesprächsquelle, Zeilen ≤60 Wörter.
- WP19 (Sub-Agent): 72 Artikel (3 je Tag), `abgang`/`ankunft` je Raum, `morgen` je Tag, 3 Relationsfakten; Validator `paper` grün, `balance` grün, Lösetag 20.

- WP18: Schlösser (`Source.lock`, `game/locks.ts`, `ui/LockPanel.tsx`): Versuch zeigt den Versuchstext mit Hinweis auf die Fundstelle, das Rätsel erscheint erst nach dem Versuch (kein „Rätsel im Raum“). Validator `locks` (Hinweis, Belohnung, Hälfte cross-room). 22 Schlösser im Berghotel (Sub-Agent), `balance` grün.

- WP11: Verwaltung unter `/#/admin` (Token, nicht verlinkt): Übersicht je Spieler (Tag, Tage beendet, Funde, Akte, Punkte, Anklage, ohne Theorie/Lösung), Spieler anlegen, Zeitung neu erzeugen, Export JSON, Zeitraffer (Staging), „Heute ist Tag N“. Nicht gebaut: Spieler deaktivieren, Zeugnis-Knopf, Gemeinsames Finale (kein Bedarf im Spielablauf).

## Offen im Inhalt (WP10b-Nacharbeit, später)
- Je Raum/Tag mehr untersuchbare Funde als Aktionen nur in Salon, Küche, Lobby; Tage 1–5 haben fast keine Untersuchen-Funde, Dachboden erst ab Tag 20 (Grenzen und Bots neu kalibrieren, `docs/07`).
- Namen in `insider.yaml`; Stichprobe der Dialogtexte lesen.

## Bekannt
- `tools/integration/api.int.ts` ist veraltet (Test `actions.used`, Altlast „Int-P“): reparieren oder löschen.
- Ein Spiel kopiert Profil und Punkte beim Anlegen (D64): nach Änderungen an `config/` Staging-Spiele neu anlegen.
- Prod: Migrationen 0000–0300 sind angewendet, kein Fall geladen, keine Functions deployt, `SUPABASE_PROD_ANON_KEY` fehlt in `.env`.

## Staging-Spiele (Tests nie in diesen!)
/#/freunde und /#/familie: je „Detektiv A“, „Detektiv B“ (Tag 1, nichts gespielt), „Tag 6“ (bis Tag 5 vorgespielt) plus Altspieler. Datum fälschen: `?now=2026-12-24T12:00:00+01:00`. Zurücksetzen: `npm run reset-player -- <slug> "<Name>" <Tag>` (nur Staging). Playwright und Lighthouse nutzen eigene Spiele `e2e-test`, `e2e-freunde`, `e2e-familie` und löschen ihre Spieler.

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
