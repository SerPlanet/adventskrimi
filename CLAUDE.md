# CLAUDE.md – Arbeitsregeln (zuerst lesen, bleibt kurz)

Projekt: **Adventskrimi „Berghotel“** – Browser-Spiel über 24 Tage (1.–24.12.2026) für eine Freundesgruppe (~4) und die Familie (variabel, 10–80 Jahre). Die Spieler sind Detektive in einem eingeschneiten Berghotel und lösen einen Diebstahl aus der Nikolausnacht. Code-Freeze 29.11., Start 1.12.2026.

## 1. Startroutine (höchstens 3 Dateien)
1. Diese Datei.
2. `docs/STATUS.md` → dort steht das „Nächste Work Package“.
3. `docs/wp/WPxx-….md` und nur die darin verlinkten Doku-Abschnitte.

Nie den ganzen `docs/`-Ordner lesen. Landkarte: `docs/00-index.md`. Arbeitsablauf im Detail: `docs/agent/workflow.md`.

## 2. Parallelität (hart)
- Höchstens **1 Haupt-Agent**. Er darf höchstens **1 Sub-Agent gleichzeitig** haben, nie mehr.
- Sub-Agent nur für: (a) breite Suche, (b) unabhängige Prüfung, (c) isolierte Fleißarbeit (z. B. Fall-Inhalte schreiben, WP10).
- Auftrag an den Sub-Agent: Ziel, Dateipfade, Doku-Refs, Abnahmekriterium, „Ergebnis in ≤15 Zeilen“. Den Projektkontext nicht wiederholen.
- Haupt- und Sub-Agent bearbeiten nie dieselben Dateien.

## 3. Token-Disziplin (nicht verhandelbar)
- Erst `Grep`/`Glob`, dann gezielt lesen (offset/limit). Keine Datei komplett lesen, wenn 30 Zeilen reichen.
- Nichts erneut lesen, was schon im Kontext ist. Nach eigenen Edits nicht zur „Kontrolle“ neu lesen.
- Ausgaben kappen: `| tail -n 30`, `--silent`, `--reporter=dot`. Nie ausgeben: Lockfiles, `node_modules`, `dist`, generierte Dateien, große YAML/JSON, komplette Logs.
- Gezielt testen (`vitest <datei>`). Die volle Suite nur vor Abschluss eines WP.
- Keine neue Dependency ohne Eintrag im Entscheidungslog (`docs/09`). Nichts ohne Anlass neu installieren oder bauen.
- Keine unaufgeforderten Zusatzdateien (Zusammenfassungen, Reports, Plan-Dokumente, README-Varianten). Doku nur dort ändern, wo sie veraltet ist.
- Kein Refactoring außerhalb des WP, keine spekulativen Abstraktionen, kein Aufräumen nebenbei.
- **Beim Ersetzen löschen:** Wird ein Mechanismus, ein Feld oder ein Layout ersetzt, wird der alte Weg im selben WP entfernt. Keine zwei Systeme nebeneinander, keine „vorsichtshalber“ behaltenen Altpfade. Übergangscode nur mit Eintrag im Entscheidungslog und Entfernungs-WP (`WP06i`). Nach jedem WP `knip` laufen lassen, sobald es eingerichtet ist.
- Pro Fehler höchstens 2 Versuche mit demselben Ansatz. Danach Ursache analysieren oder als Blocker in `STATUS.md` eintragen und stoppen.
- Browser/Screenshots nur zur UI-Abnahme am Ende eines UI-WP. Sonst Text/DOM lesen.
- Fall-Inhalte (`cases/`) nie komplett neu erzeugen. Nur ändern, was der Validator beanstandet.
- Dateien klein halten (≤300 Zeilen, sonst teilen), damit spätere Reads klein bleiben.
- Abschlussbericht ≤10 Zeilen, ohne Code zu wiederholen.

## 4. Unverrückbare Spielregeln (Invarianten)
1. **Lösung und noch gesperrte Inhalte verlassen nie den Server.** Der Client bekommt nur Freigeschaltetes. Die Lösung steht nicht in `docs/`, `STATUS.md`, Commit-Messages, Logs oder Chat-Ausgaben.
2. **Keine Minuspunkte, keine Streaks, kein Verfall, keine Strafen.** Ein Tipp halbiert nur die Punkte dieser einen Sache.
3. **Jeder Tag ist nachholbar** (in Reihenfolge). Punkte bleiben gleich; nur zeitgebundene Boni (Erstentdecker, Frühanklage) entfallen.
4. **Es gibt keine Aktionspunkte.** Pro Raum und Tag gibt es eine feste Menge an Entdeckungen, die frei erkundbar sind (`docs/02b`). Gespräche sind kostenlos.
5. **Ein Spieltag dauert ≤10 Minuten.** Jede Textkarte ≤60 Wörter. Kein Rätsel braucht >3 Minuten.
6. **Hinweise erzeugt das System** und Spieler können sie nicht ändern. „Aussage“ (kann falsch sein) und „Fakt“ sind immer gekennzeichnet.
7. **Keine Funktionen für Chat, Teilen, Beschatten, Lügen oder Sabotage zwischen Spielern (v1).** Soziales entsteht über die Zeitung und die Erstentdecker-Plakette.
8. **Familie und Freunde sind Konfigurationsprofile derselben Engine**, keine zwei Codebasen.
9. **Variable Spielerzahl (1–20).** Ein Profil kann ein Duo sein. Kein Passwort, Anmeldung per Namenskachel.
10. **Barrierefreiheit** (`docs/05`) gilt bei jeder UI-Änderung.
11. **Spieltag = Datum in Europe/Berlin, Wechsel 0 Uhr**, Gnadenfrist bis 3 Uhr für begonnene Tage. Testen mit Datums-Override (nur Staging).
12. Spielregeln und Zahlen stehen in `config/` und `cases/`, nie hartkodiert.
13. **Kein Fund nennt ein Urteil** („X war es nicht“). Dokumente und Beobachtungen werden nie automatisch in Raster/Zeitstrahl übertragen. Jede Figur lügt oder verschweigt aus einem entdeckbaren Grund (`docs/02b` §5).

## 5. Repo-Karte
```
app/               Frontend (Vite + React + TypeScript)
packages/engine/   Reine Spiellogik + Schemas (von Backend, Solver, Simulator genutzt)
tools/             CLI: validate-case, simulate, load-case
supabase/          migrations/, functions/
cases/berghotel/   Fall-Inhalte inkl. Lösung (SPOILER!), NUR LOKAL, per .gitignore nie im Repo   cases/_test/ = Testfall ohne Spoilerwert
config/            profiles/ (family, friends), scoring.json
docs/              Doku (siehe docs/00-index.md)
```
`app/` importiert nie aus `cases/`.

## 6. Konventionen
- TypeScript strict, Node 20, npm workspaces, Vitest (Playwright nur Smoke).
- Bezeichner und Code-Kommentare Englisch. UI-Texte und Doku Deutsch (Du-Form, einfache Sprache).
- Commit pro abgeschlossenem WP (klein, `wpNN: Kurzbeschreibung`). Push nur auf Anweisung des Menschen.

## 7. Wann fragen
- Nur bei Punkten, die in `docs/09` als „Offen“ stehen, oder nach zwei gescheiterten Versuchen.
- Sonst: sinnvollen Default wählen, eine Zeile in den Entscheidungslog (`docs/09`) schreiben, weitermachen.
- Nie um Erlaubnis für Dinge fragen, die im WP stehen.
- Aufgaben, die nur der Mensch erledigen kann (Accounts, Keys, Domains), als Checkliste in `STATUS.md` unter „Mensch“ eintragen. Keine Secrets ins Repo.
