# STATUS (Agenten pflegen diese Datei, höchstens 40 Zeilen)

Stand: 2026-11-04 · Redesign beschlossen (D74–D79). **Nächstes Work Package: WP20.** Danach WP21 → WP22 → WP23 → WP13 Teil 2 (Menschen-Test) → WP14 (Launch). Code-Freeze 29.11., Start 1.12.

## Nächste Work Packages
| WP | Inhalt | Datei |
|---|---|---|
| WP20 | Erkenntnisse/Belege, Flure, `unlock`, `actions_by_day`, Validator, Solver | `docs/wp/WP20-redesign-tag1-6.md` |
| WP21 | UI-Fluss: Gute Nacht, „Zum nächsten Tag“, Zeitung zuerst, Späträtsel, Rolle | `docs/wp/WP21-ui-fluss.md` |
| WP22 | Inhalt Tag 1–5 (Sub-Agent) | `docs/wp/WP22-inhalt-tag1-5.md` |
| WP23 | Inhalt ab Tag 6 (Sub-Agent) | `docs/wp/WP23-inhalt-ab-tag6.md` |

## Erledigt (Kurzform, Details in `git log` und den WP-Dateien)
- WP00–WP12, WP15–WP19: Engine, Schemas, Solver, Validator, Simulator, Edge Functions, Frontend, Rätsel, Raster, Zeitstrahl, Zeugnis, Anklage, Erkunden-Kern (Aktion nur bei „Genauer untersuchen“), Akte nur mit Eingelegtem, Dialog wie im Videospiel, Schlösser, Zeitung als Geschichte, Verwaltung `/#/admin`, A11y (Lighthouse 95), `knip` in der CI.
- WP13 Teil 1: `npm run timelapse` (beide Profile × 1/2/4/20 Spieler, Tag 1–24) ohne Fehler. `balance` grün (Freunde 4, Familie 3, Lösetag 20).
- Menschen-Test (Tag 1): Aktion nicht verbrauchbar, Ansehen ohne Anreiz, Gespräch zu starr, Bildschirm hängt nach „Tag beenden“, Detektiv-Thema kaum spürbar → Ursache im Redesign (WP20–WP23).

## Wochenplan bis zum Freeze (29.11.)
| Woche | Plan |
|---|---|
| 4.–8.11. | WP20 (Haupt-Agent). Ab Schema-Stand (Tag 3) startet WP22 als Sub-Agent in `cases/`. |
| 9.–15.11. | WP21 (Haupt-Agent), WP22 läuft/endet. |
| 16.–22.11. | WP23 (Sub-Agent), Validator und `balance` grün. Mensch spielt Tag 1–10 an. |
| 23.–28.11. | WP13 Teil 2 (Menschen-Test, Nachregeln), WP14 Launch-Vorbereitung (Prod-Key, Fall laden, Functions). |
| 29.11. | Freeze. |

**Ehrlich:** Realistisch sind Engine/UI (WP20/WP21) und Inhalt Tag 1–5 sowie Tag 6–14 in guter Qualität. Tag 15–24 werden eher dünn (Wiederverwendung, weniger Dinge je Raum). Ein Menschen-Test bleibt bei einem Durchlauf, Feinschliff geht danach nur über Konfiguration. Inhalte liegen auf dem Server, spätere Nachlieferung für Tag 15+ ist ohne Code-Release möglich (Entscheidung des Menschen, ob das als „Freeze“ zählt).

**Streichliste (Reihenfolge, was zuerst entfällt):**
1. Rolle als Wahlkarte: nur eine Standardrolle, Karte später.
2. Monte-Carlo-Stichprobe (Regel 7) und Späträtsel-Faktor in der UI-Anzeige.
3. Verdächtige 7 → 5, Erkenntnisse ~12 → 9, Belege je Erkenntnis 3–4 → 2–3.
4. Dinge je Raum 5 → 4 ab Tag 15, Zeitung ab Tag 15 mit wiederverwendeten Klatsch-Bausteinen.
5. Detektiv-Skin (Notizbuch), Kommentare bei „Ansehen“ nur in Tag 1–10.
Nie streichen: Gute-Nacht-Screen und „Zum nächsten Tag“, Tag 1–5, Regeln 1–4 und 6 im Validator.

## Bekannt
- Ein Spiel kopiert Profil und Punkte beim Anlegen (D64): nach Änderungen an `config/` Staging-Spiele neu anlegen.
- Prod: Migrationen 0000–0300 angewendet, kein Fall geladen, keine Functions deployt, `SUPABASE_PROD_ANON_KEY` fehlt in `.env`.
- `CLAUDE.md` §4 Nr. 3/4 sind durch D76/D77 überholt (Menschen-Beschluss). Beim Start von WP20 dort nachziehen.

## Staging-Spiele (Tests nie in diesen!)
/#/freunde und /#/familie: „Detektiv A“, „Detektiv B“, „Tag 6“ plus Altspieler. Datum fälschen: `?now=2026-12-24T12:00:00+01:00`. Zurücksetzen: `npm run reset-player -- <slug> "<Name>" <Tag>`. Playwright/Lighthouse nutzen `e2e-*`.

## Mensch (kann kein Agent tun)
- [ ] Spieler-Namen, Profilwahl und Rollen bereitstellen (WP14)
- [ ] Prod: `SUPABASE_PROD_ANON_KEY` in `.env`, Fall laden, Functions deployen, Spiele anlegen (WP14)
- [ ] Domain/Link verteilen; Namen in `insider.yaml`
- [ ] Ab 16.11. Tag 1–10 selbst durchspielen und Rückmeldung geben
