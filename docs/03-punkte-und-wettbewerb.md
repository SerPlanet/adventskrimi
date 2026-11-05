# 03 – Punkte und Wettbewerb

Alle Zahlen sind **Startwerte** und stehen in `config/scoring.json`. Der Simulator und die Testläufe justieren sie.

## Grundsätze
- **Nie Minuspunkte.** Fehler geben 0, ein Tipp halbiert (abgerundet) die Punkte dieser einen Sache.
- Nachholen gibt dieselben Punkte (nur Erstentdecker und Frühanklage hängen am echten Zeitpunkt).
- Der Anteil „Mitdenken“ (Zeugnisse + Finale) soll **≥35 %** der möglichen Gesamtpunkte sein. Reines Reinklicken gewinnt nicht.

## Tagespunkte (je Spieltag, maximal 14)
| Quelle | Punkte |
|---|---|
| Tag gespielt (≥1 Aktion) | +2 |
| Neuer Fund in der Akte | +2 pro Fund, Tagesdeckel +6 |
| Rätsel des Tages gelöst | +3 (mit Tipp +1, Überspringen 0) |

## Besondere Punkte
| Quelle | Punkte |
|---|---|
| Stollen-Übungsfall (Tag 5) | +10 |
| Erstentdecker-Plakette | +5 (ca. 10 markierte Funde im Spiel) |
| Wochenzeugnis (Tag 10/14/18/22) | +5 je richtiger Kategorie (max. +20 pro Zeugnis) |
| Finale: Wer, Wann, Wo, Komplize | je +40 (160) |
| Finale: 2 Beweisfragen | je +25 (50) |
| Frühanklage-Bonus (optional) | siehe unten |

Ungefähre Maximalsumme: 336 (Tage) + 10 + 50 + 80 + 210 + 24 = ~710. Mitdenken = 80 + 210 = 290 ≈ 41 %.

## Frühanklage (Konfigurationsschalter `early_accusation`)
Standard: **für Freunde und Familie an**, ab `early_accusation_from_day = 20` (davor ist die Lösung laut Tempo-Prüfung `07` §3 technisch nicht herleitbar). Ein Spieler darf die volle Anklage verbindlich abgeben (inkl. Beweisfragen). Bonus = `6 × (24 − Tag) × (richtige Kategorien / 4)` → Tag 20: bis 24, Tag 23: bis 6. In der Zeitung steht nur „X hat Anklage erhoben“, nie ob richtig. Auflösung bleibt bis Tag 24 gesperrt, auch für Früh-Ankläger. Ein Früh-Ankläger spielt weiter (Tagespunkte, Rätsel), kann aber die Theorie nicht mehr ändern.

## Ränge (nur aus Gesamtpunkten)
Praktikant 0 · Ermittler 60 · Inspektor 160 · Kommissar 320 · Meisterdetektiv 500 (Schwellen in Konfig). Öffentlich sichtbar mit Namen.

## Sichtbarkeit
- **Öffentlich:** Gesamtpunkte, Rang, Plakettensammlung, „Ermittler des Tages“, wer Anklage erhoben hat.
- **Privat:** Theorie, Zeugnis-Details (welche Kategorie richtig war), Hinweisverlauf.
- **Rangliste-UI:** Gesamtliste, die eigene Zeile und die direkten Nachbarn hervorgehoben („12 Punkte hinter Oma“). Kein Prozentbalken zur Lösung.

## Gemeinschaftsbalken (Should)
Alle Spieler füllen gemeinsam einen Balken (Summe der Tagespunkte). Meilensteine schalten kleine Story-Extras frei (Zeitungs-Sonderausgabe, Zusatz-Epilog). Ohne Wirkung auf den Fall.

## Auszeichnungen (Could)
Ende Tag 24: Spaßtitel ohne Punkte (z. B. „Beste Beobachterin“, „Schnellster Ankläger“, „Meister der Widersprüche“), aus der Spieldatenbank berechnet.

## Anti-Missbrauch
- Punkte werden ausschließlich serverseitig aus einem Ledger (`score_ledger`) berechnet.
- Jeder Punktgewinn hat eine eindeutige Referenz (`kind + ref`), doppelt vergeben ist unmöglich.
