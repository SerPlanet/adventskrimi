# WP20 – Redesign Tag 1–6: Erkenntnisse, Flure, geführte Tage (Engine, Schema, Validator)

**Ziel:** Tag 1–5 sind geführt (feste Wege, echte Wahl zwischen Dingen), ab Tag 6 ist alles frei. Der Fall besteht aus **Erkenntnissen** mit mehreren **Belegen**. **Lies:** `docs/02b`, `02c`, `09` (D74–D79). **Fasst an:** `packages/engine`, `tools/`, `config/`, `app/` nur für Pflichtanpassungen der API. Kein Inhalt (WP22/WP23), kein Fall-Spoiler hier.

## 1. Datenstruktur (minimal)
- **`insights.yaml` (neu, nur Server/Autor):** `{id, text, needs?: [id]}`. `needs` bildet die Kette. Der Client sieht sie nie.
- **Beleg = bestehendes Fact/Statement.** Neues Feld `supports: [insight_id]`. Art (`kind`), Raum, Tag und Aktion stehen schon in `Source` (`talk`, `inspect`, `room`, `days`).
- **`Source`:** neu `route?: [flur_id]` (nur Tag 1–5 sinnvoll; ohne Angabe gilt es für alle) und `unlock?: {day_from?, asked?: [id], has?: [item]}`. `unlock` gilt für Gesprächsfragen und für Dinge (Brett erscheint erst nach der Schlüsselfrage).
- **Budget je Tag:** `config/profiles/*.json` bekommt `actions_by_day` (Tag 1: 1, Tag 2–5: 2, danach Profilwert). Keine Zahl im Code.
- **Ansehen** liefert einen Kommentar des Detektivs (`look_note`, Beobachtung ohne Urteil). Das ist Inhalt, kein Mechanismus.

## 2. Zimmer-, Flur- und Routenmodell (1–20 Spieler)
- Der Fall hat ~8 Gemeinschaftsräume und **3–4 Flure** (`corridors` in `rooms.yaml`). Ein Flur hat ein Zimmer-Vorlagen-Set (`zimmer_template`: Raum mit untersuchbaren Dingen).
- **Route = Flur.** `routes.yaml`: je Flur der Raum für Tag 2, 3 (Zimmer), 4 und 5 (alle Flure treffen sich in dem Raum, in dem die Schneekugel gezeigt wird). Tag 1 ist für alle die Lobby.
- **Zuweisung:** Der Spieler bekommt beim Anlegen den nächsten Flur reihum (`corridor` im Spielerstand, gespeichert). Optional kann `config/profiles/*.json` je Spieler `corridor` vorgeben. Ein Spieler: Flur 1.
- Die Zimmernummer ist nur Anzeige (aus Flur und Reihenfolge erzeugt). Es werden keine 20 Zimmer erfunden. Gäste im selben Flur teilen Weg und Funde.
- Ab Tag 6: freie Bewegung. Keine Sperrräume, keine Tagestore (D75). Zugang nur über Passwort-Ketten (`Source.lock`, WP18).
- **Server-Filter:** Die API liefert für Tag 1–5 nur die Quellen des eigenen Flurs. Ab Tag 6 alle.

## 3. Rolle (Erzählvariante)
`config/profiles/*.json`: `roles: [{id, name, anrede, intro}]` (Privatdetektiv, Journalist, Polizist, …). Erzähltexte verwenden `{rolle}`/`{anrede}`. Es gibt keinen Spielunterschied. Wahl und Anzeige gehören zu WP21.

## 4. Validator (neu, in `tools/validate-case`)
1. Jede Erkenntnis hat ≥2 Belege aus verschiedenen Quellen.
2. **Leave-one-out:** Fällt jede einzelne Quelle weg, ist der Fall noch lösbar.
3. **Jeder Flur allein** löst den Fall (Tag 1–5 nur seine Quellen, danach sinnvolles Budget laut `actions_by_day`).
4. Jeder Flur liefert in Tag 1–5 gleich viele Erkenntnisse (und gleiches Beleg-Muster, z. B. 2 Aussagen + 1 Fakt).
5. Jeder Raum hat ≥ Budget+1 untersuchbare Dinge mit Beleg. Jede Aktion liefert etwas.
6. Kein Beleg nennt ein Urteil (Wortliste: „war es“, „unschuldig“, „Täter“, „lügt“, „also“; dazu Stichprobe). Aussage/Fakt gekennzeichnet.
7. Stichprobe (Monte-Carlo): Bots mit zufälligen ~60 % der Belege lösen in ≥90 % der Läufe. Ein harter Worst-Case-Beweis ist mathematisch nicht möglich.
8. Dialogfragen mit `day_from` ≥6 (z. B. Diebesnacht) kommen vor Tag 6 nicht vor. Jede Frage hat eine Antwort, jede Zeile ≤60 Wörter (besteht).

**Solver heute:** `balance` (optimaler Lösetag), `plan`, `locks`, `paper`. **Neu:** Erkenntnisebene, Flur-Simulation, Leave-one-out, Stichprobe, Beleg-Lint.

## 5. Beleg-Schreibmuster (für WP22/WP23)
`{id, insight, kind: statement|fact|doc|obs, text ≤60 Wörter, flag: Behauptung|Fakt}`. Intern hat jede Aussage `wahr|falsch` plus einen Grund der Figur. Ein Beleg nennt Ort, Zeit, Person oder Gegenstand, nie die Folgerung. Pro Erkenntnis trägt jeder Beleg ein anderes Detail. Mischung etwa 40 % Aussage, 30 % Fakt, 30 % Dokument/Beobachtung. Du-Form, einfache Sprache.

## 6. Zeitungsrätsel rückwirkend
`config/scoring.json`: `newspaper_puzzle_late_factor` (Standard 0.75). Wer ein Zeitungsrätsel nach seinem Kalendertag löst, bekommt Punkte × Faktor. Kein Minus (D77).

## Abnahme
- Schemas, Server-Filter, `unlock`, `actions_by_day`, Flur-Zuweisung und die 8 Validator-Regeln laufen, mit Tests an `cases/_test` (zwei Flure, Test-Insights). Pro Regel ein Test, der sie auslöst.
- 1, 2, 4 und 20 Spieler bekommen gültige Flure. Der Client erhält keine Quelle fremder Flure vor Tag 6.
- Volle Suite grün, `knip` sauber. Alte Raumwahl für Tag 1–5 und ungenutzte Felder sind entfernt (kein Parallelsystem).

## Nicht tun
`cases/berghotel/` anfassen, Sperrräume/Tagestore bauen, Rolle als Spielunterschied, Lösung in Docs.
