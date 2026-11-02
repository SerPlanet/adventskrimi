# 06 – Architektur

## Stack (Defaults, Änderungen im Entscheidungslog)
- **Frontend:** Vite + React + TypeScript, statisch gebaut. Hosting: GitHub Pages, deployt per GitHub Action aus dem **privaten** Repo (private Pages brauchen GitHub Pro, kostenlos im Student Developer Pack). Fallback: Cloudflare Pages. Die Fall-Daten und die Lösung liegen nie im veröffentlichten Build, auch nicht verschlüsselt.
- **Backend:** Supabase (Postgres + Edge Functions in TypeScript). Alle Spiellogik in `packages/engine` (reine Funktionen), von den Functions, vom Solver und vom Simulator gemeinsam genutzt.
- **Umgebungen:** `staging` (Zeitraffer, Testfall) und `prod`. Eigene Supabase-Projekte.
- Kein Realtime nötig. Der Client pollt höchstens beim Öffnen und nach Aktionen.

## Sicherheit (Pflicht)
1. Tabellen mit Fall-Inhalten (`case_*`) und Spielstand sind per RLS für `anon`/`authenticated` **komplett gesperrt**. Zugriff nur über Edge Functions mit Service-Rolle.
2. Der Client erhält nur freigeschaltete Funde, die Zeitung bis zum heutigen Tag und die Rangliste. Nie Lösung, `world.yaml`, noch nicht erreichte Quellen oder Zukunftstage.
3. Das Frontend-Bundle enthält keine Fall-Daten (`app/` importiert nie aus `cases/`). CI-Check `tools/check-bundle` sucht im Build nach Marker-Strings aus dem Testfall und aus `case.yaml`-Lösungs-IDs.
4. **Akzeptiertes Restrisiko:** Anmeldung per Namenskachel ohne Passwort. Wer die API kennt, könnte sich als anderer Spieler ausgeben. Für Freunde/Familie bewusst akzeptiert. Mitigation: Funktionen akzeptieren nur `player_id` aus dem Spiel, protokollieren Aktionen im Ledger.
5. Keine Secrets im Repo. `.env` ist in `.gitignore`.
6. Supabase-Free-Tier pausiert nach Inaktivität: vor Launch Keep-Alive-Ping oder wöchentlicher Aufruf (WP14).

## Datenmodell (Tabellen, Kernspalten)
| Tabelle | Zweck |
|---|---|
| `games` | `id`, `name`, `profile` (family/friends), `start_date`, `config jsonb`, `case_id` |
| `players` | `id`, `game_id`, `name`, `avatar`, `is_duo`, `settings jsonb`, `next_day` |
| `case_*` | Importierte Fall-Inhalte (rooms, npcs, facts, statements, sources, puzzles, events, questions, newspaper_templates, solution) |
| `player_days` | `player_id`, `day`, `room_id`, `actions_used`, `finished_at`, `next_room_id` |
| `discoveries` | `player_id`, `source_id`, `item_id`, `day`, `ts` (unique: player+item) |
| `inventory` | `player_id`, `item_id`, `from_day` |
| `puzzle_state` | `player_id`, `puzzle_id`, `attempts`, `hints_used`, `solved_at` |
| `daily_answers` | `player_id`, `day`, `question_id`, `correct`, `hint_used` |
| `daily_puzzles` | `player_id`, `day`, `type`, `level`, `solved`, `hint_used` |
| `theory` | `player_id`, `category`, `value`, `updated_at`, `history jsonb` |
| `accusations` | `player_id`, `answers jsonb`, `proof_answers jsonb`, `submitted_at`, `early` |
| `score_ledger` | `player_id`, `kind`, `ref`, `points`, `day`, `ts` (unique: player+kind+ref) |
| `plaques` | `source_id` (unique), `player_id`, `ts`, `title` |
| `newspaper` | `game_id`, `day`, `content jsonb`, `generated_at` (unique game+day) |
| `admin_log` | wichtige Admin-Aktionen |

Punkte sind nur ein Ledger. Gesamtpunkte = Summe. Nichts wird überschrieben.

## API (Edge Functions, alle POST, JSON)
`state` (Spieler-/Tagesstatus + sichtbare Funde) · `open_day` · `act` (Befragen/Untersuchen/Benutzen) · `end_day` (nächster Raum) · `answer_daily` · `daily_puzzle` · `object_puzzle` · `set_theory` · `accuse` · `scoreboard` · `newspaper` · `settings` · `admin_*`.
Jede mutierende Funktion trägt eine `request_id`, ist **idempotent** und liefert den neuen `state` zurück.

## Tageslogik
- Aktueller Spieltag `today = tag(now)` mit `now` in Europe/Berlin und Tag 1 = `games.start_date`. `GAME_NOW_OVERRIDE` gilt nur in Staging (Funktion bricht in Prod ab, wenn gesetzt).
- Spieler spielen Tage in Reihenfolge ab `players.next_day` bis maximal `today`. Gnadenfrist: Hat der Spieler Tag `today−1` begonnen, darf er ihn bis 3:00 beenden.
- **Zeitung** wird beim ersten Abruf eines Tages erzeugt (Sperre über Unique-Constraint), aus Ereignis, Vorlagen und anonymisierten Zahlen des Vortags, danach unveränderlich gespeichert.
- **Gerüchte-Regel:** nur wenn ≥3 aktive Spieler am Vortag. Schwellen in Konfig (z. B. ≥50 % in einem Raum = „Großversammlung“).
- **Aktion verbrauchen:** Quelle auflösen → neue Funde? ja: buchen, `actions_used+1`, Ledger-Punkte; nein: nichts buchen, Atmosphäre-Text. Prüfung der Verfügbarkeit (Tag, Raum, NPC-Plan, Ereignis, `requires`).
- **Erstentdecker:** `plaques.source_id` Unique-Insert; wer ihn bekommt, gewinnt. Gilt nach Zeitstempel der Aktion.
- **Wochenzeugnis, Frühanklage, Finale:** beim ersten Aufruf nach Fristende erzeugt, plus Admin-Knopf als Sicherheitsnetz. Kein Cron zwingend nötig.
- **Auflösung:** `solution` wird nur geliefert, wenn `accusation` existiert und `today ≥ 24`.

## Konfiguration
`config/profiles/{family,friends}.yaml`: Räume/NPC-Auswahl, Aktionen pro Tag, Bewegungsmodus, Hilfen, Frühanklage an/aus, Gerüchte-Schwelle, Rätselpool-Level.
`config/scoring.json`: alle Punktewerte und Rangschwellen. Beim Laden werden beide mit Schemas aus `packages/engine` validiert.

## Repo-Struktur
Siehe Karte in `CLAUDE.md`. Zusätzlich: `tools/load-case` schreibt validierte Fall-Daten in die `case_*`-Tabellen des gewählten Supabase-Projekts. `supabase/migrations` enthält alle Schemaänderungen.

## Tests
- Engine: Vitest, rein funktional, mit `_test`-Fall.
- Functions: Integrationstests gegen lokales/staging Supabase mit Zeitraffer.
- UI: Playwright-Smoke (Namenswahl → Zeitung → Aktion → Akte).
- Spoiler-Check im CI (`tools/check-bundle`).
- Balance: `tools/simulate` (siehe `07`).

## Backup und Betrieb
Wöchentlicher Export aus `score_ledger`, `discoveries`, `theory`, `accusations` als JSON (Skript `tools/export`), manuell vom Menschen auslösbar. Admin-Knopf „Tag neu berechnen“ nur für Zeitung (nie Punkte).
