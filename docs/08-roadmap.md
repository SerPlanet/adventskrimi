# 08 – Roadmap

Es arbeitet immer nur 1 Haupt-Agent (+ höchstens 1 Sub-Agent). Die Zeitfenster sind Ziele, keine Fristen. Der Engpass sind meist Menschen-Aufgaben und Abnahmen.

## Reihenfolge und Fenster
| Nr | WP | Fenster | Abhängig von | Datei |
|---|---|---|---|---|
| 0 | Setup | 2.–4.11. | – | `wp/WP00-setup.md` |
| 1 | Schemas und DB | 4.–6.11. | WP00 | `wp/WP01-schemas.md` |
| 2 | Solver und Validator | 6.–10.11. | WP01 | `wp/WP02-solver.md` |
| 3 | Engine-Kern | 8.–11.11. | WP01 | `wp/WP03-engine.md` |
| 10 | Fall-Inhalte (Sub-Agent) | ab 10.11. bis 24.11. | WP02 | `wp/WP10-fall-inhalte.md` |
| 5 | Backend | 11.–14.11. | WP03 | `wp/WP05-backend.md` |
| 6 | Frontend-Kern | 12.–16.11. | WP05 | `wp/WP06-frontend-kern.md` |
| 6b | UI-Redesign (Hotel, Raum, Popups, Zeitung) | nach M2 | M2 | `wp/WP06b-ui-redesign.md` |
| 6c | Erkunden-Kern (Regeln, Daten, API) | nach M2, zuerst | M2 | `wp/WP06c-erkunden-kern.md` |
| 6d | Props, Szenen, Nahansichten | nach WP06c | WP06c | `wp/WP06d-props-szenen.md` |
| 10b | Inhalt-Umbau (Lügennetz, Dokumente, Dialoge) | parallel zu WP06d (Sub-Agent) | WP06c | `wp/WP10b-inhalt-umbau.md` |
| 7 | Rätsel | 15.–17.11. | WP06 | `wp/WP07-raetsel.md` |
| 9 | Wertung und Rangliste | 15.–17.11. (Teil 1), 19.–21.11. (Teil 2) | WP05, WP06 | `wp/WP09-wertung.md` |
| – | **M1 Kalender-Light online** | ~17.11. | WP06, WP07, WP09-T1 | – |
| 8 | Raster, Zeitstrahl, Theorie | 17.–21.11. | WP06 | `wp/WP08-raster-zeitstrahl.md` |
| – | **M2 Spielbar mit Testfall** | ~21.11. | WP08, WP09 | – |
| 4 | Simulator und Bots | 19.–23.11. | WP02, WP03 | `wp/WP04-simulator.md` |
| 11 | Admin-Ansicht | 21.–23.11. | WP05 | `wp/WP11-admin.md` |
| 12 | Barrierefreiheit und Feinschliff | 22.–25.11. | WP08 | `wp/WP12-a11y-polish.md` |
| – | **M3 Inhalte final** | ~24.11. | WP10, WP04 | – |
| 13 | Testlauf | 24.–28.11. | M2, M3 | `wp/WP13-testlauf.md` |
| 14 | Launch | 28.–30.11. | WP13 | `wp/WP14-launch.md` |
| – | **M5 Start** | 1.12. | | |

Die Nummern folgen der Themenlogik, nicht der Reihenfolge. Die Tabelle gibt die Reihenfolge vor.

## Sub-Agent-Einsatz (die einzige erlaubte Parallelität)
- **WP10 Fall-Inhalte** läuft als Sub-Agent neben den Code-WPs des Haupt-Agenten (verschiedene Verzeichnisse: `cases/` vs. Rest).
- Review und Spoiler-Check dürfen kurzzeitig einen Sub-Agent nutzen, wenn WP10 gerade nicht läuft.

## Risiken
| Risiko | Gegenmaßnahme |
|---|---|
| Inhalte brauchen länger als Code | WP10 startet früh, Familienprofil zuerst, Freunde-Vollversion zuletzt |
| Balance falsch | Simulator früh nutzen, Werte in Konfig |
| Menschen-Aufgaben verzögern | Checkliste in `STATUS.md`, WP00 ganz am Anfang |
| Uni-Stress | Kürzungsreihenfolge aus `01`, M1 als Fallback |
| Server-Pause (Free Tier) | Keep-Alive, Staging getrennt |

## Abnahme der Meilensteine
- **M1:** Namenswahl, Zeitung mit Tagesereignis + Rätsel des Tages + Frage, Rangliste, deployed auf Prod-URL, Admin legt Spieler an.
- **M2:** Auf `_test` spielbar: Aktionen, Bewegung, Akte, Raster, Zeitstrahl, Theorie, Wochenzeugnis, Finale (Zeitraffer in Staging).
- **M3:** `validate-case` grün für beide Profile, Bots im Soll (`07` §5).
- **M4/WP13:** Zeitraffer-Durchlauf 24 Tage, 2 Menschen testen (Mensch aus der Familie ≥60 und ein Freund), alle kritischen Fehler behoben.
