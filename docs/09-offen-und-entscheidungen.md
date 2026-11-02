# 09 – Offen und Entscheidungslog

Neue Einträge: eine Zeile. Agenten tragen Defaults hier ein, statt zu fragen (siehe `CLAUDE.md` §7).

## Offen (braucht den Menschen, Default gilt bis Antwort)
| ID | Frage | Default |
|---|---|---|
| O3 | Titel, Hotelname, Beute, Tonfall | „Berghotel Edelweiß“, „Goldene Schneekugel“, gemütlicher Krimi |
| O4 | Motiv als fünfte Kategorie | Nein in v1 |
| O5 | Mensch spielt mit | Nein, Beobachter |
| O6 | Schach-Rätsel (Pool aus CC0-Puzzle-Datenbank) | Nur Freunde, Could |
| O7 | Familie: Bewegung frei oder Nachbarräume | Frei |
| O8 | Gleicher Starttermin für Familie und Freunde | Ja, 1.12. |
| O9 | Insider/Namen der Gruppe im Fall | Optional über `insider.yaml`, der Mensch befüllt |
| O10 | Punktewerte | Startwerte in `03`, Anpassung nach WP13 |

## Entschieden
| ID | Entscheidung |
|---|---|
| D1 | Genre: eingeschneites Berghotel, Diebstahl statt Mord, Tat in der Nikolausnacht (Tag 6) |
| D2 | Jeder Spieler löst allein, Rangliste, Anklage am 24. durch alle |
| D3 | Gesuchte Kategorien: Wer, Wann, Wo, Komplize (+2 Beweisfragen) |
| D4 | Pacing über Aktionsbudget und Bewegung, nicht über zeitgebundene Beweise |
| D5 | Boden/Decke: Zeitung als Basis für alle, Raum/Aktion als Detail |
| D6 | Keine leeren Aktionen: nur Aktionen mit neuem Fund verbrauchen Budget |
| D7 | Aussage vs. Fakt gekennzeichnet, NPCs dürfen lügen, Spieler nie |
| D8 | Kein Teilen, Chat, Beschatten, Sabotage in v1 |
| D9 | Soziales über Zeitung: Gerüchte (anonymisiert, ≥3 Spieler) und Erstentdecker-Plaketten |
| D10 | Keine Minuspunkte, keine Streaks, kein Verfall; Nachholen jederzeit in Reihenfolge |
| D11 | Tageswechsel 0:00 Europe/Berlin, Gnadenfrist bis 3:00 |
| D12 | Anmeldung per Namenskachel ohne Passwort, Duo-Profile möglich |
| D13 | Notizstufen Auto/Halb/Manuell pro Spieler |
| D14 | Rätsel des Tages in der Zeitung: nur Punkte, ohne Fallbezug |
| D15 | Objekt-Rätsel nur als Schloss vor einem Fund, nie alleiniger Weg |
| D16 | Familie und Freunde = Profile derselben Engine, Familie = abgespeckter Fall |
| D17 | Stack: Vite/React/TS, Supabase, GitHub Pages, Solver/Simulator als TS-Tools |
| D18 | Max. 1 Haupt-Agent + 1 Sub-Agent gleichzeitig |
| D19 | Auflösung wird erst nach eigener Abgabe und ab Tag 24 gezeigt |
| D20 | Prolog Tag 1–5 als Einführung mit Stollen-Übungsfall |
| D21 | Frühanklage für Freunde und Familie, frühestens ab Tag 20, weil davor die Lösung nicht herleitbar sein darf (Tempo-Prüfung `07` §3) |
| D22 | WP00-Dependencies: react 18, vite 5, @vitejs/plugin-react, typescript 5, vitest 2, eslint 9 + typescript-eslint, prettier 3, supabase CLI (devDep), @types/node 20 |
| D23 | Pages-Deploy baut mit `BASE_PATH=/<repo>/`; Staging und Prod getrennt über Supabase-Projekte (Build-Variablen), Pages selbst nur ein Ziel. Zweite Pages-Umgebung erst bei Bedarf (WP12) |
| D24 | Ordner `adventskrimi/` und `adventskrimi.zip` im Projektroot (Doku-Duplikat) sind per `.gitignore` ausgeschlossen; Mensch kann sie löschen |
| D25 | WP01: Zusätzliche Dependencies zod 4, yaml, pg, tsx, @types/pg. `case_*`-Tabellen haben generische Form `(case_id, id, data jsonb)`, Validierung nur über Zod vor dem Import |
| D26 | Loader (`packages/engine/src/loader.ts`) ist Node-only und nicht in `index.ts` exportiert, damit der Browser-Bundle keine fs/YAML-Abhängigkeit zieht |
| D27 | `load-case` verbindet über den Supabase-Pooler (aus `supabase link`) mit `SUPABASE_<ENV>_DB_PASSWORD` aus `.env`; Testfall wird nie nach prod geladen |
| D28 | Profil `family.yaml` hat bis WP10 keine konkreten Raum-/NPC-IDs (leeres `include`); Satzlänge-Grenze 18 Wörter in `quality.json` |
| D29 | Solver: Tupel = (Wer, Komplize, Wann, Wo). Dieb ist im Zeitfenster am Tatort, Komplize am Ablenkungsort (aus `world.crime`), Dieb ≠ Komplize. Wahre Aussagen zählen wie Fakten, falsche liefern keine Information |
| D30 | Schlüssel-Fakt = Fakt, dessen Entfernung die Zahl der konsistenten Tupel erhöht. Redundanz zählt unterschiedliche erreichbare Quellen |
| D31 | Widerlegbarkeit: direkter Positionskonflikt mit einem erreichbaren Fakt ODER Widerspruch zur aus allen erreichbaren Funden folgenden Lösung |
| D32 | Tempo-Planer ist ein Beam-Search (greedy je Raum) und damit eine Heuristik: „zu früh lösbar“ ist verlässlich, „zu spät“ kann pessimistisch sein. Zeitung ist kostenlos, Rätselräume lösen das Rätsel ohne Aktion, Gegenstände (`requires` auf Item) gelten als erfüllt |
| D33 | Neue optionale Felder `red_herring`, `reinterpreted_on` an Fakten/Aussagen für die Mindestmengen. Fallweise Qualitäts-Overrides in `<fall>/quality.override.json` (nur `_test`) |
| D34 | WP03: Engine ist reiner Zustand (`PlayerState`) + `GameCtx`; Funktionen geben neuen Zustand zurück. Quellen dürfen auch Gegenstände (`items`) in `yields` liefern. Zeitung ist gratis und zählt nicht als gespielter Tag; Hotelbuch ist eine normale Aktion |
| D35 | Erstentdecker entscheidet der Server (Unique-Insert), die Engine liefert nur Plaketten-Kandidaten und bucht Punkte. Frühanklage-Bonus bekommt nur, wem der Aufrufer `earlyDay` (aus `isOnTime`) übergibt |
| D37 | Repo ist öffentlich (kostenlose Pages). `cases/berghotel/` ist per `.gitignore` ausgeschlossen, lokal + Supabase. Backup des Falls macht der Mensch. CI validiert nur `_test`; `berghotel` validiert/lädt der Mensch/Agent lokal. |
| D36 | Umbenennbare Verdächtige: Fall-Texte nutzen `{n:<npc_id>}` und `{anrede:<npc_id>}`, geschlechtsneutral formuliert (keine Pronomen). `load-case` ersetzt sie anhand `names:` in `<fall>/insider.yaml` (`renameCase`). IDs und Lösung bleiben unverändert. Validator `texts` prüft Platzhalter-IDs; in Plaketten-Titeln und Gerüchten sind sie verboten |
| D37 | WP05: Handler sind reine Funktionen gegen ein `Store`-Interface (`packages/engine/src/api`), getestet mit `MemoryStore`. Edge Functions sind dünne Hüllen (`supabase/functions/_shared/http.ts`, `pgstore.ts`). Engine wird per esbuild zu `_shared/engine.js` gebündelt (git-ignoriert, `npm run build:functions`). Neue devDependencies: `postgres`, `esbuild` |
| D38 | `players.state jsonb` hält den Engine-Zustand, die normalisierten Tabellen (Ledger, Funde, Tage, Plaketten) werden parallel geschrieben. Anfragen pro Spieler serialisieren über `SELECT … FOR UPDATE`, Idempotenz über `request_log`. Zeitung: Insert-once per Unique-Key |
| D39 | Zeit: `APP_ENV=staging` erlaubt Header `x-game-now`/`GAME_NOW_OVERRIDE`; alles andere gilt als Prod und bricht bei gesetztem Override ab. Admin-Funktion prüft `ADMIN_TOKEN` (Secret, lokal in `.env` als `ADMIN_TOKEN_STAGING`). Integrationstests: `npm run test:int` |
| D40 | Ein Deployment, mehrere Spiele: Der Link `/#/<slug>` wählt das Spiel (`games.slug`), Namenskacheln pro Spiel, kein Zugriffsschutz außer dem Slug. |
| D41 | WP05/WP06: Slug (D40) in jedem Spieleraufruf, Server prüft Übereinstimmung; `lobby` ohne Spiele-Liste (keine Aufzählung fremder Spiele). Spielerkennung pro Slug im Browser. Neue devDependencies: `@playwright/test` (nutzt installiertes Chrome), `lighthouse`; Befehle `npm run e2e`, `npm run a11y` |
| D42 | WP07: Rätsel des Tages deterministisch aus `slug:tag:stufe`, Art rotiert (Zahlenfeld, Buchstabensalat, Zahlenrätsel, Logelei); Stufe pro Spieler, am ersten Kontakt des Tages festgelegt und nur aus Stufen des Profils (Familie: leicht/mittel). Tipp-Leiter 1, 2, Lösung (Lösung beendet ohne Punkte). Schach (O6) bleibt Could und ist nicht gebaut |
| D43 | 9×9-Zahlenfeld (Stufe schwer) hat bei 360 px nur ca. 34 px große Felder (unter 48 px). Ausgleich: Eingabe über große Zahlentasten (48 px); Stufe schwer ist freiwillig. Objekt-Rätsel akzeptieren Antworten ohne Rücksicht auf Groß-/Kleinschreibung, Leerzeichen und Umlaute |
| D44 | Gemeinschaftsbalken (Should, WP09 Teil 1) nicht gebaut; Zeugnis, Anklage, Auflösung folgen in WP09 Teil 2 nach WP08 |
