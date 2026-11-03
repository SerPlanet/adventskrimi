# 04 – Fall und Inhalte

Gilt für WP01 (Schemas), WP02 (Validator) und WP10 (Inhalte). **Dieses Dokument enthält keine Lösung.**

## 1. Gesuchte Kategorien
| Kategorie | Familie | Freunde |
|---|---|---|
| Wer (Dieb) | 5 Kandidaten | 8 |
| Komplize | 4 Kandidaten (≠ Dieb) | 7 |
| Wann (Zeitfenster der Nacht 22:00–06:00) | 4 × 2 h | 8 × 1 h |
| Wo (Versteck der Beute) | 6 Orte | 9 |
Optional später: Motiv (nicht in v1). Dazu 2 Beweisfragen (Mehrfachauswahl, je 4 Optionen), die auf Schlüssel-Widersprüche zeigen.

## 2. Ein Fall, zwei Profile
`cases/berghotel/` enthält den **vollen Fall (Freunde)**. `config/profiles/family.yaml` wählt eine Teilmenge (Räume, NPCs, Funde, Zeitfenster-Gruppierung) und setzt Parameter (Aktionen/Tag, Bewegung, Hilfen). Jedes Profil muss den Validator **einzeln** bestehen (`07`). Das Familienprofil darf Funde und Verdächtige streichen, die Lösung bleibt dieselbe Geschichte.

## 3. Dateien (YAML) in `cases/<fall>/`
| Datei | Inhalt |
|---|---|
| `case.yaml` | Titel, Start (Tag 1 = 2026-12-01), Tatnacht, Kategorien, **Lösung** (SPOILER), Beweisfragen |
| `world.yaml` | Wahrheit: pro Person × Zeitfenster der Tatnacht der Raum; Tatort, Ablenkungsort, Ablauf der Tat (SPOILER) |
| `rooms.yaml` | Räume, Nachbarschaften, Beschreibung, Objekte (mit `auffaellig`) |
| `npcs.yaml` | Figuren, Rolle, Tagesplan (Tag → Raum), Themenliste, Eigenheit |
| `facts.yaml` | Atomare Wahrheiten (siehe §4) |
| `statements.yaml` | Aussagen von Figuren mit Wahrheitswert |
| `sources.yaml` | Wo/wann/wie man Funde bekommt (siehe §5) |
| `puzzles.yaml` | Objekt-Rätsel und Gegenstände |
| `events.yaml` | Tagesereignisse 1–24, Wetter, Raumsperren, Bonus-Raum-Tage |
| `newspaper.yaml` | Klatsch, Anzeigen, Gerüchte-Vorlagen, Plakettentitel |
| `questions.yaml` | Fragen des Tages (aus Zeitung/Hotelbuch lösbar) |
| `prolog.yaml` | Tage 1–5, Stollen-Mini-Fall, Page-Erklärtexte |

## 4. Fakt-Typen (Solver-fähig)
Jeder Fakt hat `id`, `text` (≤60 Wörter, einfache Sprache), `type` und Parameter:
- `presence`: Person P war im Zeitfenster Z im Raum R.
- `absence`: Person P war im Zeitfenster Z **nicht** im Raum R.
- `exclusion`: Kandidat K ist in Kategorie C ausgeschlossen.
- `link`: Wenn Kategorie C1 = A, dann C2 ∈ Menge M.
- `object_state`: Objekt O war zu Zeit Z in Zustand S (z. B. Fenster offen), mit definierter Folge für eine Kategorie.
Neue Typen nur nach Eintrag im Entscheidungslog und Update dieser Liste.
**Ab WP06c:** `exclusion` darf nie als sichtbarer Fund erscheinen (kein Urteil, siehe `02b` §3). Der Solver darf ihn intern ableiten. Sichtbare Funde sind Beobachtungen (`presence`, `absence`, `object_state`), Aussagen, Dokumente.

## 5. Quellen
Eine **Quelle** liefert Funde. Felder: `id`, `kind` (talk | inspect | use | newspaper | hotelbook), `room`, `npc` oder `object`, `topic`, `days` (Liste oder Bereich, an denen sie verfügbar ist, folgt Tagesplan), `requires` (Gegenstand/Rätsel, optional), `auffaellig` (bool), `yields` (Fakt-/Aussage-IDs), `plaque` (optional, neutraler Titel).
Regeln:
- Jede Quelle liefert ≥1 Fund. Keine Quelle ohne Fund, außer reine Atmosphäre-Objekte ohne `auffaellig`.
- Atmosphäre-Objekte kosten nie eine Aktion (siehe `02`, §5).
- Quellen am selben Ort an verschiedenen Tagen dürfen unterschiedliche Funde liefern (Tagesplan).

Präsentation (optional, für das UI-Redesign `WP06b`): `presentation` = `dialog` (mit `lines`: Liste aus `speaker` + `text`), `note` (mit `note: {from, to, text}`, z. B. ein Zettel), `object` (Gegenstandskarte) oder `ambient` (Atmosphäre ohne Fund). Der gesamte Popup-Text einer Quelle ≤60 Wörter. Räume erhalten `plan {x,y,w,h}`, `doors [{a,b,at}]`, `outside`, `stairs` (Grundriss auf einer Ebene, ersetzt `floor`/`col`) sowie `objects[].spot {x,y}`, `scale`, `layer` für die Szene. Türen müssen exakt dem Raumgraphen entsprechen.

## 5b. Erkunden-Format (ab WP06c)
- **Dinge** (`things`) je Raum: `id`, `room`, `spot {x,y}`, `prop` (Vektor-Prop), `states` (z. B. zu/auf), `auffaellig`, `layers`: L0 Ansehen, L1 Untersuchen (`opens`: Zustandswechsel, liefert Funde), L2 Benutzen (`requires`: Gegenstand/Fund).
- **Verfügbarkeit** je Fund: `room`, `days` (Raum-Tag-Menge). Pro Raum/Tag 4–7 Entdeckungen, Prolog weniger.
- **Dokument:** `id`, `title`, `kind` (zettel/brief/foto/quittung), `text` (Volltext ≤60 Wörter), `found_at`.
- **Gespräch:** Themen mit `lines`, `shows` (welcher Fund neue Antworten freischaltet), `witness_of` (Verweis auf andere Figur).
- **Lügennetz:** je Figur `secret` (Grund), `lies` (Liste von Aussagen mit `reason`, `refuted_by`, `confirmed_by`).
- **Verknüpfungen** (`links`): Paare von Funden mit Text „Das erinnert dich an …“ (kein Urteil).
- **Tagesbogen** (`beats`): je Tag Titel, geplanter Aha-Moment, neue Erkenntnis.

## 6. Aussagen und Lügen
Aussage: `id`, `npc`, `text`, `claims` (Fakt-ähnlich), `truth: true|false`. NPCs dürfen lügen, aber:
- Jede falsche Aussage muss durch mindestens einen erreichbaren Fakt widerlegbar sein (Validator prüft).
- Lügen haben ein Motiv, das später erklärbar ist (oft ein harmloses Geheimnis, nicht der Diebstahl).
- Ab WP06c lügt oder verschweigt **jede** Figur mindestens einmal (`02b` §5, D54). Damit das lesbar bleibt: Familie höchstens 5, Freunde höchstens 8 Figuren mit Lügen, davon in der Familie nur 2 mit gravierenden (diebstahlnahen) Lügen. Alle anderen Lügen sind harmlos und haben einen entdeckbaren Grund.

## 7. Qualitätsregeln für Inhalte
1. **Redundanz:** Jede Schlüssel-Tatsache für die Lösung ist über ≥3 Wege (Freunde) bzw. ≥2 Wege (Familie) erreichbar, über unterschiedliche Räume/Quellen.
2. **Kein Rätsel ist alleiniger Weg** zu einer Schlüssel-Tatsache.
3. **Neudeutung:** ≥3 Funde aus Tag 1–5 gewinnen nach Tag 6 neue Bedeutung.
4. **Widersprüche:** ≥4 Aussage-Fakt-Widersprüche und ≥2 Aussage-Aussage-Widersprüche, die Zeitstrahl und Raster nutzen.
5. **Falsche Fährten:** Freunde ≥4, Familie ≥2, jeweils auflösbar.
6. **Leseaufwand:** Karten ≤60 Wörter, Zeitung ≤250 Wörter, Sätze ≤18 Wörter im Familienprofil. Kein Fachjargon.
7. **Tonfall:** gemütlich-schräger Wintermärchen-Krimi, keine Gewalt, kein Mord. Insider und Namen der Gruppe nur in Zusatzdateien (`cases/berghotel/insider.yaml`), die der Mensch befüllt.
8. **Spoilerfreiheit der Zeitung:** Plakettentitel und Gerüchte nennen nie Ort oder Inhalt eines Fundes.

## 8. Mengen (Richtwerte)
| | Familie | Freunde |
|---|---|---|
| Räume | 6 | 9 |
| NPCs | 5–6 | 8 |
| Fakten + Aussagen | ~45 | ~80 |
| Quellen | ~70 | ~130 |
| Objekt-Rätsel | 6 | 10 |
| Ereignisse | 24 | 24 |
| Fragen des Tages | 23 | 23 |
Die Mengen ergeben sich aus der Redundanz-Regel. Der Validator rechnet nach (`07`).

## 9. Arbeitsweise für Inhalte (WP10)
1. Erst `world.yaml` + `case.yaml` (Lösung) festlegen, dann Fakten aus der Wahrheit ableiten, dann Aussagen (inkl. Lügen), dann Quellen und Tagespläne.
2. Nach jedem Schritt `validate-case` laufen lassen und **nur beanstandete Stellen** ändern.
3. Gesamte Dateien nie neu erzeugen. Kleine Patches.
4. Der Mensch bekommt die Lösung nie zu sehen: Ausgaben und Kommentare nennen sie nicht.
5. Der Testfall `cases/_test/` (2 Räume, 3 NPCs, triviale Lösung) bleibt als Engine-Testfall bestehen und enthält keinen Spoilerwert.
