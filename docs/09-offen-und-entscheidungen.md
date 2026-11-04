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
| D5 | ~~Zeitung als Boden~~ ersetzt durch D48 |
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
| D45 | WP08/09: Notizen (Raster, Zeitstrahl), Theorie-Verlauf, Zeugnisse und Anklage-Ergebnis liegen im Spielerstand (`players.state`), keine neue Migration. Zeitstrahl-Karten sind einzelne Behauptungen (`item#n`). Zeugnis-Satz nennt nur die Trefferzahl. Auflösung = `world.crime.steps` als Kapitel, Schlüssel `story` in der Ansicht. Spielerstände werden beim Laden mit `normalizeState` ergänzt. |
| D46 | WP04: Bot `optimal` = gieriger Informationsgewinn mit Raumwahl nach bester Tagesausbeute (kein DP), `greedy` = erste Quelle, `worst` = kleinster Gewinn aber ≥1 Fund. Alle Bots außer `random` lösen Objekt-Rätsel; `optimal`/`greedy` lösen das Tagesrätsel. Kandidatenzahlen zählen Tag-Ende. Das Familienprofil ist auf `_test` entartet (Verdächtige werden nach Berghotel-Namen gekürzt), daher dort nur Freunde im Zeitraffer-Test. |
| D47 | UI-Redesign nach M2 (`WP06b`): Querschnitt-Karte, Raumszene mit Hotspots, Popups für Dialog/Notiz/Gegenstand, Kerzen, Zeitungs-Titelseite. Akte/Rangliste bleiben. |
| D48 | Der Boden (niemand versteht am Ende nichts) kommt aus den **Aktionen** (Redundanz, keine leeren Aktionen, Tipps), nicht aus der Zeitung. Die Zeitung allein darf nicht zur Lösung reichen. Bots `random`, `casual`, `worst` sichern den Boden. |
| D49 (ersetzt durch D62) | Erkunden statt Aktionsbudget (`02b`): feste Entdeckungen pro Raum und Tag, alles frei, Gespräche kostenlos. Invariante 4 ersetzt. |
| D50 | Dokumente werden eingesteckt, sind im Volltext erneut lesbar und nie automatisch in Raster/Zeitstrahl. Kein Fund nennt ein Urteil (Invariante 13). |
| D51 | Lügennetz: jede Figur lügt/verschweigt aus entdeckbarem Grund, Zeugenverweise, Aha-Bausteine Verknüpfung, Déjà-vu, Bestätigung. |
| D52 | Look: einheitliche Vektor-Props (SVG/React) mit Zuständen, vom Agenten erstellt, läuft statisch auf GitHub Pages. Familien-Räume zuerst. |
| D53 (Übergangscode in WP06i entfernt) | WP06c: Kompatibilitätsschicht statt Umbau: „Dinge“ = rooms.objects (+ optional prop/states), L1 = inspect-Quelle, L2 = use-Quelle (requires = Zeigen), Dokument = Quelle mit document, Zeugenverweis = witness_of. Neu optional: case.yaml links/beats/format (explore schaltet Lügennetz- und Tagesbogen-Prüfung ein), npcs secret/lies. Kein Aktionsbudget; actions_per_day optional und ignoriert. Verknüpfen +3 (config/scoring.json link), Endpunkt link. Déjà-vu noch nicht gebaut. |
| D54 | WP10b: max_liars in den Profilen angehoben (Freunde 8, Familie 5), weil 02b §5 „jede Figur lügt" gilt; die Grenze aus 04 §6 ist damit überholt. Items waren im Familienprofil durch applyProfile herausgefiltert (Fix: Items bleiben). Platzhalter wie {n:leitung} werden immer ersetzt (load-case und API). Ausrufezeichen nur bei Dingen mit Fund an diesem Raum/Tag. Dokumente werden per pocket eingesteckt (state.pocket). |
| D55 | Jeder Bereich bekommt einen eigenen Skin (Zeitung, Hotelplan, Raum, Akte). Theorie/Rangliste bleiben. Gemeinsam: Navigation, Barrierefreiheit. |
| D56 | Hotelplan als **ein Grundriss** wie Cluedo (Räume, Flur, Türen, Außenbereich, Treppen zu Keller/Dachboden), Türen = Raumgraph. Ersetzt `floor`/`col`. |
| D57 | Zeitung: eine scrollbare Seite im echten Zeitungslook, Kachel-Artikel, einfache Überblendung zwischen Tagen, kein Seitenblättern. Zugriff nur bis min(heute, eigener Spieltag), serverseitig. |
| D58 | Akte als Aktenordner mit Reitern und Karteikarten (keine Tafel mit Schnüren). Verknüpfungen auf den Karten. |
| D59 | Schriften werden lokal gebündelt (OFL, WOFF2), kein CDN. Eintrag der konkreten Fonts erfolgt in WP06e. |
| D60 | Beim Ersetzen wird der alte Weg im selben WP gelöscht. Übergangscode (D53, `normalizeState`, Fallbacks) wird in `WP06i` vor dem Freeze entfernt. `knip` prüft in der CI auf tote Teile. |
| D61 | WP06e: Schriften lokal in `app/public/fonts/` (alle OFL, WOFF2 latin): Playfair Display 800 (21 KB, Zeitungskopf), Source Serif 4 400/700 (19+21 KB, Text), Courier Prime 400/700 (19+19 KB, Akte). Skins in `app/src/skins.css`, Layout `.wrap`/`.cols2`. |
| D62 | Hybrid: Ansehen, Gespräche und Lesen frei, nur „Genauer untersuchen“ kostet 1 Aktion (kleines Tagesbudget, UI „Aktionen übrig (x/y)“). Ersetzt D49 teilweise (Invariante 4 geändert). Keine „!“-Markierungen, nicht alle Dinge anklickbar (Deko/Ansehen/Untersuchbar). |
| D63 | WP06i: `knip` als Dev-Abhängigkeit (findet ungenutzte Dateien, Exporte, Abhängigkeiten), läuft in der CI (`npm run knip`, Konfiguration `knip.json`). Entfernt: `normalizeState` (Staging-Spieler haben alle Felder, Prod hat keine), `format: legacy|explore` im Fall (die Lügennetz- und Tagesbogen-Prüfung gilt immer), Hotspot-Notbehelf ohne `spot`, `states`, tote CSS-Klasse. `spot` und `scene` sind Pflicht. |
| D64 | `lie_web` in `config/quality.json` (Standard `true`): Nur winzige Test-Fälle (`cases/_test`) schalten die Lügennetz- und Tagesbogen-Prüfung per `quality.override.json` ab. Spiel-Snapshot: Ein Spiel kopiert Profil und Punkte beim Anlegen. Nach Änderungen an `config/` müssen bestehende Staging-Spiele neu angelegt oder ihre `config` ersetzt werden. |
| D65 | Tagesablauf v2 (`02c`): Erzähltext zum Einstieg, Zeitung mit 3–5 Geschichten (nur Fakten), Tag-Reiter mit Statuschip, kein Bereich „Rätsel im Raum“. |
| D66 | Selbstbestimmung: Der Spieler legt selbst in die Akte (Artikel, Gesprächsantworten). Verknüpfen-Knopf, Déjà-vu, automatisches Eintragen und Notizstufen Auto/Halb entfallen. Optionale Hilfestufe (Standard aus). Ersetzt Teile von D50/D51. |
| D67 | Zeitstrahl als Tabelle (Zeitfenster oben, Räume links, mehrere Personen pro Zelle), nur Spielerdaten. |
| D68 | Gespräche starten sofort als Dialog, jede Frage hat eine Antwort, Antworten einzeln in die Akte legbar. |
| D69 | Schlösser verweisen auf Fundstellen in anderen Räumen, hinter ihnen liegen belohnende Funde. |
| D70 | Reihenfolge: WP15 bis WP19 vor WP06i (Aufräumen). |
| D71 | Keine Hilfestufe und keine Erleichterungs-Optionen für ältere oder jüngere Spieler (ersetzt Teil von D66). Alle Spieler lösen die Rätsel selbst. Barrierefreiheit (Schrift, Kontrast, Bedienung) bleibt, nur die Spielschwierigkeit wird nicht gesenkt. |
| D72 | WP16: Spielerstand hat `filed` (Akte), `table` (Zeitstrahl-Tabelle) und `grid` als Pflichtfelder; Zeitung liefert `articles` (id, title, text) statt headline/gossip; Rätselstufe ist für alle `medium` (keine Erleichterung, D71). Neue Fall-Datei-Felder: `newspaper.yaml` `articles`. |
| D73 | Tests laufen nur in eigenen Staging-Spielen (`e2e-*`), nie in `freunde`, `familie`, `test`. `npm run reset-player` setzt Testspieler zurück (löscht alles, was der Spieler tat, und die gespeicherten Zeitungen des Spiels). |
| D74 | Redesign (WP20–WP23): Tag 1–5 geführt (feste Route je Flur, Tag 1 Lobby, Tag 3 Zimmer, Tag 5 Präsentation), ab Tag 6 frei. Fall besteht aus Erkenntnissen (`insights.yaml`) mit ≥2 Belegen (`supports` an Fakt/Aussage). Zur Lösung reichen ~60 % der Belege (Stichprobe, kein Worst-Case). Flure statt fester Routenzahl: Zuweisung reihum, Zimmernummer nur Anzeige (1–20 Spieler). |
| D75 | Keine Sperrräume und keine Tagestore, auch nicht als Notbehelf. Ab Tag 6 sind alle Räume frei, Zugang nur über Passwort-Ketten (Aktion in Raum A, Passwort für Raum B). Ein zu früher Lösetag ist kein Fehler. Der Mensch spielt durch und regelt nach. Zielrichtung: verständlich und gut lösbar. |
| D76 | **Aktionsmodell (ändert Invariante 4, Raumwahl in 02b):** Budget je Tag steht in `actions_by_day` (Tag 1: 1 Tutorial-Aktion am Schlüsselbrett, das erst nach der Schlüsselfrage erscheint; Tag 2–5: 2 aus 3 Dingen; ab Tag 6 Profilwert). Dinge und Gesprächsfragen können per `unlock` freigeschaltet werden. Gespräche, Ansehen und Lesen bleiben frei. Raumwahl am Vorabend entfällt in Tag 1–5. Diebesnacht-Fragen erst ab Tag 6. |
| D77 | **Ändert Invariante 3:** Zeitungsrätsel sind nach ihrem Kalendertag lösbar, mit Faktor `newspaper_puzzle_late_factor` (Standard 0,75, `config/scoring.json`) auf die Punkte. Kein Minus, keine Strafe (Invariante 2). Alle anderen Punkte bleiben beim Nachholen gleich. |
| D78 | Rolle (Privatdetektiv, Journalist, Polizist, …) kommt aus `config/profiles/*.json` (`roles`), ist nur Erzähl- und Anrede-Variante ohne Spielunterschied. Wahl per Karte nach der Namenskachel, Vorgabe durch die Verwaltung möglich, Wechsel bis Ende Tag 1. NPCs: Mitarbeiter und Besitzer, Gäste nur als Gruppe. |
| D79 | Nachholer sehen nach „Tag beenden“ „Zum nächsten Tag“, wenn dieser spielbar ist, und landen erst im Erzähltext, dann in der Zeitung. Sonst „Morgen ab 0 Uhr“ (Invariante 11 unverändert). Reihenfolge: WP20 → WP21 → WP22 → WP23 → WP13 Teil 2 → WP14. |

- D72 (WP12): Kein Hilfeknopf „Ich komme nicht weiter“ (widerspricht D71/Invariante 14); stattdessen „So funktioniert’s“ in den Einstellungen. WebKit-Smoke entfällt (nicht installiert), Chrome genügt.
