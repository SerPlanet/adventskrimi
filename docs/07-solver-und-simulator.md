# 07 – Solver, Validator, Simulator

Gilt für WP02 (Solver/Validator) und WP04 (Simulator). Alle Grenzwerte sind Startwerte in `config/quality.json`.

## 1. Solver
Eingabe: Fall + Profil. Modell: Unbekannte sind die Kategorien (Wer, Komplize, Wann, Wo). Kandidatenraum = Produkt der Kategorien (Familie ≈ 5×4×4×6 = 480, Freunde ≈ 8×7×8×9 ≈ 4000). Brute-Force reicht.
Ein Kandidatentupel ist **konsistent**, wenn es alle bekannten Fakten erfüllt (Typen siehe `04` §4) und die Grundregeln der Tat gelten (Dieb am Tatort im Zeitfenster, Komplize am Ablenkungsort, keine Person an zwei Orten gleichzeitig).
Ausgaben: Anzahl konsistenter Tupel bei gegebener Faktenmenge, übrige Kandidaten je Kategorie.

## 2. Validator (`tools/validate-case <fall> --profile <p>`)
Prüft in dieser Reihenfolge und bricht bei Schemafehlern früh ab. Ausgabe: je Prüfung eine Zeile ✓/✗ plus höchstens 10 Fehlerzeilen.
1. **Schema** (Zod) für alle Dateien, IDs eindeutig, Referenzen existieren.
2. **Wahrheit:** Alle Fakten stimmen mit `world.yaml`. Aussagen mit `truth:true` sind wahr, `truth:false` sind falsch.
3. **Eindeutigkeit:** Mit **allen** erreichbaren Funden bleibt genau 1 konsistentes Tupel (die Lösung).
4. **Erreichbarkeit:** Jede Quelle ist über Tagesplan, Raumgraph, Ereignisse und `requires` mindestens einmal wirklich erreichbar.
5. **Redundanz:** Jede Schlüssel-Tatsache hat ≥3 (Freunde) / ≥2 (Familie) unabhängige Wege (`04` §7).
6. **Rätsel-Regel:** Kein Objekt-Rätsel ist alleiniger Weg zu einer Schlüssel-Tatsache.
7. **Widerlegbarkeit:** Jede falsche Aussage ist durch ≥1 erreichbaren Fakt widerlegbar.
8. **Neudeutung/Widersprüche/Fährten:** Mindestmengen aus `04` §7.
9. **Texte:** Wortzahl je Karte ≤60, Zeitung ≤250, Satzlänge-Grenze im Familienprofil. Plakettentitel und Gerüchte spoilerfrei (kein Raum-/Objektname).
10. **Tempo (Budgetprüfung):** siehe §3.

## 2b. Zusatzprüfungen ab WP06c (Erkunden, Lügennetz)
- **Lügennetz:** Jede Figur hat ≥1 Lüge/Verschweigen mit `reason`. Jeder Grund ist über ≥2 Wege entdeckbar. Jede Figur wird von ≥2 anderen erwähnt oder bestätigt.
- **Zeugenketten:** Jede falsche Aussage ist durch Fakt **oder** Zeugen widerlegbar, und der Zeuge ist erreichbar.
- **Keine Urteile:** Textprüfung auf Verbotsmuster („war es nicht“, „ist unschuldig“, „ist der Dieb“) in allen sichtbaren Texten.
- **Dokumente:** Jedes Dokument ≤60 Wörter und mit `found_at`. Kein Dokument ist alleiniger Weg zu einer Schlüssel-Tatsache.
- **Tagesbogen:** Jeder Tag hat `beat`. Je besuchtem Raum ≥1 neuer Fund pro Tag möglich.
- **Aha-Dichte:** ≥1 Verknüpfung oder Widerspruch pro Woche je Schwerpunktfigur.

## 3. Tempo-Prüfung (ersetzt „zeitgebundene Hinweise“)
Pacing entsteht durch **Raumwahl pro Tag** und die Verteilung der Funde auf Räume und Tage (kein Aktionsbudget ab WP06c), nicht durch gesperrte Beweise.
Planer: sucht den **frühesten Spieltag**, an dem ein einzelner perfekter Spieler (kennt die Daten, wählt optimal) die Lösung eindeutig herleiten kann (DP/BFS über Zustand `(Tag, Raum, Funde, Inventar)`; pro Tag wählt er einen Raum und erhält alle dortigen Funde dieses Tages).
Soll: **frühestens Tag 20–21** (Frühanklage beginnt Tag 20, davor darf nichts herleitbar sein). Liegt er davor, sind Hinweise zu dicht/zu nah: Validator meldet die Stellschrauben (Aktionen/Tag senken, Schlüssel-Quellen weiter auseinander, Wege verlängern). Liegt er nach Tag 22, ist der Fall zu hart.

## 4. Simulator (`tools/simulate <fall> --profile <p> --bot <name>`)
Reine Engine-Läufe, keine UI, keine DB. Bots:
| Bot | Verhalten | Soll-Ergebnis |
|---|---|---|
| `optimal` | Plant optimal wie der Solver-Planer | Fertig frühestens Tag 20–21 |
| `greedy` | Wählt immer die nächste auffällige Quelle im Raum | Fertig bis Tag 24 |
| `random` | Zufällige legale Aktionen (viele Seeds) | Median: ≤3 Kandidaten je Kategorie am Tag 24 |
| `casual` | Spielt nur 1 zufällige legale Aktion pro Tag (wenig Zeit) | Median: ≤4 Kandidaten je Kategorie am Tag 24 |
| `newspaper_only` | Liest nur die Zeitung und beantwortet die Tagesfrage | **kein Ziel**, nur Information: Die Zeitung allein soll **nicht** zur Lösung reichen |
| `worst` | Wählt Aktionen mit minimalem Informationsgewinn | ≤4 Kandidaten je Kategorie am Tag 24, mind. 1 Fund pro Tag |
Pro Lauf ausgegeben (Kurzform, max. 20 Zeilen): Tag der Eindeutigkeit, Kandidaten je Kategorie am Tag 10/17/24, Punkte-Verlauf, Anteil „Mitdenken“, Anzahl leerer Aktionen.

## 5. Balance-Ziele (Gate für WP10/WP13)
- `optimal` löst frühestens Tag 20–21; `greedy` löst bis Tag 24.
- Der **Boden kommt aus den Aktionen, nicht aus der Zeitung**: `random`, `casual` und `worst` erreichen die Grenzen der Tabelle. `newspaper_only` hat bewusst kein Ziel, die Zeitung trägt Stimmung und Ereignisse, nicht die Lösung.
- Kein Bot hat an einem Tag 0 neue Funde, außer bei Raumsperre per Ereignis.
- Mitdenken-Anteil an den Gesamtpunkten ≥35 %.
- Der Spieler-Tagesaufwand (Wörter lesen + Aktionen ≈ 150 Wörter/Min.) liegt ≤10 Min. für `greedy`.
- Für das Familienprofil gelten dieselben Grenzen. Das Tempo-Fenster darf bis Tag 22 reichen (einfacherer Fall, mehr Hilfen), frühestens aber ebenfalls Tag 20.

## 6. Reparieren statt neu schreiben
Bei einem Verstoß ändert man gezielt: Quellen verschieben, Tagespläne anpassen, Funde ergänzen, Aktionsbudget justieren. **Nie** den ganzen Fall neu erzeugen. Nach jeder Änderung nur den betroffenen Check erneut ausführen (Flag `--only <check>`), am Ende einmal alles.
