# 02 – Spielregeln

## 1. Rahmen der Geschichte (spoilerfrei)
Arbeitstitel „Berghotel Edelweiß“. Ein Schneesturm sperrt den Pass, die Polizei erreicht das Hotel erst am 24.12. Gäste und Personal (NPCs) sind eingeschlossen. In der Nikolausnacht (5./6.12.) verschwindet die „Goldene Schneekugel“ (Arbeitstitel). Die Spieler sind Detektive und müssen bis zum 24.12. benennen: **Wer** war der Dieb, **Wann** geschah es, **Wo** ist die Beute versteckt, **Wer** war Komplize. Namen, Beute und Lösung legt der Inhalts-WP fest (WP10).

## 2. Phasen
| Tage | Phase | Inhalt |
|---|---|---|
| 1–5 | Prolog | Ankunft, Figuren kennenlernen, jeden Tag eine Funktion lernen, kleiner Übungsfall „Stollen“ |
| 6 | Tat | Morgens wird der Diebstahl entdeckt, Hauptfall beginnt |
| 7–23 | Ermittlung | Aktionen, Zeitung, Rätsel, Theorien |
| 24 | Finale | Anklage abgeben, Auflösung (nach eigener Abgabe) |

Hinweise aus Tag 1–5 können später neu bedeutsam werden („Neudeutung“). Alles aus dem Prolog landet im automatisch geführten **Hotelbuch** (nachlesbar).

## 3. Der Spieltag (≤10 Min.)
1. **Zeitung** lesen (~2 Min.): Ereignis, Klatsch, Wetter, Anzeigen, Gerüchte, Ermittler des Tages, Rätsel des Tages.
2. **Hotel:** Du bist in einem Raum (Start: Raum vom Vortag, Tag 1 Lobby). Du siehst NPCs, Objekte, Auffälligkeiten.
3. **Aktionen** (Anzahl siehe §5): Befragen, Untersuchen, Benutzen.
4. **Frage des Tages** (~1 Min.).
5. **Rätsel des Tages** (optional, ≤3 Min., nur Punkte).
6. **Tag beenden:** nächsten Raum wählen (§4). Danach ist der Tag abgeschlossen.
Reihenfolge ist frei, außer „Tag beenden“ zuletzt. Ein Tag zählt als gespielt, wenn mindestens eine Aktion oder die Frage des Tages erledigt wurde.

## 4. Räume und Bewegung
Hotel = Graph aus Räumen (Familie 6, Freunde 9) mit Flur als Knoten. Beim Tag-Ende wählt man den Raum für den nächsten Tag. **Familie:** jeder Raum frei wählbar. **Freunde:** nur Nachbarräume. Konfigurierbar (`config/profiles`). Welche NPCs wann in welchem Raum sind, ist pro Tag fest vorgeschrieben (Tagesplan). Die Welt ist deterministisch und unabhängig von Spielern.

## 5. Aktionen
Budget pro Tag: Familie 3, Freunde 4 (Prolog: Tag 1 → 1, Tag 2–3 → 2, Tag 4–5 → 3). Werte sind Konfiguration, der Simulator justiert sie.

| Aktion | Wirkung |
|---|---|
| **Ansehen** (gratis) | Beschreibung jedes Objekts/jeder Person. Zeigt Auffälligkeit („wirkt nervös“, „irgendetwas liegt unter dem Teppich“). Kostet nichts. |
| **Befragen** | Person im Raum + Thema aus ihrer Themenliste wählen. Liefert Aussage(n) oder Fakt(en). |
| **Untersuchen** | Objekt wählen, das als „auffällig“ markiert ist (oder unmarkiert, dann meist leer). Liefert Fakt(en) oder einen Gegenstand. |
| **Benutzen** | Gegenstand aus dem Inventar auf Objekt/Person anwenden. Öffnet Quellen, die ein Schloss haben (Objekt-Rätsel §9). |

**Regel „Keine leeren Aktionen“:** Eine Aktion wird nur verbraucht, wenn sie mindestens einen **neuen** Eintrag für den Spieler liefert. Liefert sie nichts (leer) oder schon Bekanntes, kommt eine kurze Atmosphäre-Meldung („Dazu weiß der Koch nichts.“) und das Budget bleibt unverändert. Wert bleibt: Der Spieler sieht vorher nur, *dass* etwas auffällig ist, nicht wie wertvoll es ist.

## 6. Fund-Typen
- **Fakt:** wahre Beobachtung (z. B. „Schneespuren im Treppenhaus um 02:00“). Gekennzeichnet mit Lupen-Symbol.
- **Aussage:** Behauptung einer Figur (z. B. „Ich war die ganze Nacht im Bett.“). Gekennzeichnet mit Sprechblasen-Symbol, **kann falsch sein**.
- **Gegenstand:** kommt ins Inventar.
Alle Funde erzeugt das System aus den Fall-Daten. Spieler können Text nicht ändern. Jeder Fund trägt Quelle und Tag („Koch, Küche, Tag 9“).

## 7. Zeitung („Der Bergbote“)
Wird pro Tag aus den Fall-Daten und dem Vortag erzeugt (siehe `06`). Bestandteile:
1. **Titelstory** = Tagesereignis (Basisinfo für alle, z. B. Stromausfall, Gast reist ab, Bonus-Raum).
2. **Klatschspalte:** Aussagen, teils falsch. Futter für Widersprüche.
3. **Wetter:** kann Wege oder Räume einschränken.
4. **Anzeigen:** verstecken manchmal Codes für Rätsel.
5. **Gerüchte:** aus anonymisierten Zahlen des Vortags (z. B. „Großversammlung im Speisesaal“, „Der Keller liegt verlassen da“). Nur wenn ≥3 aktive Spieler. Nie Hinweise auf *Inhalte* von Funden.
6. **Gästebuch/Plaketten:** „X hat den seltsamen Schlüssel als Erster gefunden“. Neutraler Titel pro Plakette, nie Ort oder Inhalt.
7. **Ermittler des Tages** (meiste Tagespunkte des Vortags).
8. **Rätsel des Tages** (§9).

## 8. Werkzeuge des Spielers
Fallakte, Verdächtigenraster, Zeitstrahl, Karte, Inventar, Theorie-Seite, Hotelbuch, Rangliste. Bedienung: `05`.

**Notizstufen** (Einstellung pro Spieler, Familien-Standard „Halb“):
- *Auto:* Das System trägt Funde automatisch in Raster und Zeitstrahl ein.
- *Halb:* Das System schlägt Einträge vor, der Spieler bestätigt.
- *Manuell:* Der Spieler heftet Funde selbst an und trägt selbst ein.

**Widersprüche:** Der Zeitstrahl markiert Einträge, die sich nach den *eigenen* bisherigen Einträgen des Spielers widersprechen (z. B. dieselbe Person zur selben Zeit an zwei Orten, Aussage gegen Fakt). In „Manuell“ ist die Markierung aus; dort bestätigt ein Knopf „Passt das zusammen?“ gratis Ja/Nein für zwei gewählte Einträge.

## 9. Rätsel
- **Rätsel des Tages** (in der Zeitung): kommt aus einem Pool (Sudoku, Worträtsel, Zahlenrätsel, Logeleien; Schach nur Freunde). Hat **keinen Einfluss auf den Fall**, gibt nur Punkte. Schwierigkeit pro Spieler einstellbar (leicht/mittel/schwer). Tipp-Leiter, Überspringen ohne Abzug von Bestandspunkten.
- **Objekt-Rätsel** (im Hotel, 6 Familie / 10 Freunde im ganzen Spiel): Schloss vor einer Quelle (Zahlencode, Chiffre, Wort aus gesammelten Buchstaben, Querverweis auf ein Detail aus einem anderen Raum, Widerspruch zwischen zwei Aussagen). Lösung gibt Zugriff auf den Fund. Höchstens 3 Min., immer mit Tipp-Leiter (Tipp 1, Tipp 2, Lösung zeigen). Kein Rätsel ist der einzige Weg zu einer Schlüssel-Tatsache (siehe `04`, Redundanz).

## 10. Frage des Tages
Eine Verständnisfrage mit 3 Antworten, lösbar aus der heutigen Zeitung oder dem eigenen Hotelbuch. Zwei Versuche. Sorgt für den Boden: Wer die Zeitung liest, versteht die Lage.

## 11. Theorie, Zeugnisse, Anklage
- **Theorie:** Jederzeit änderbar. Vier Felder: Wer, Wann, Wo, Komplize. Nur der Spieler sieht sie.
- **Wochenzeugnis** (Tage 10, 14, 18, 22): Snapshot der Theorie um Tagesende, Punkte pro richtiger Kategorie. Der Inspektor gibt einen Satz zum Stand, ohne die Wahrheit zu nennen.
- **Anklage** (ab Tag 24, mit Frühanklage ab Tag 20, siehe `03`): Theorie festlegen + 2 Beweisfragen (Mehrfachauswahl, z. B. „Welcher Widerspruch überführt den Dieb?“). Nach Abgabe nicht mehr änderbar. Alle müssen bis zum Ende abgeben (bis 31.12., ohne Strafe).
- **Auflösung:** Eine Geschichte, die den Fall erklärt. Wird dem Spieler erst nach eigener Abgabe **und** frühestens ab Tag 24 gezeigt. Admin kann „Gemeinsames Finale“ (Rangliste groß) freischalten.

## 12. Tageswechsel und Nachholen
- Spieltag = Datum Europe/Berlin, Wechsel 0:00. Wer vor 0:00 einen Tag beginnt, darf ihn bis 3:00 beenden.
- Jeder Spieler spielt die Tage **in Reihenfolge**. Verpasste Tage holt man nach (je ≤10 Min.), den „heutigen“ Tag als Obergrenze. Zeitungen früherer Tage sind jederzeit lesbar. Kein Punktabzug. Boni, die am echten Zeitpunkt hängen (Erstentdecker, Frühanklage), entfallen für Nachzügler.
- Ein übersprungener Tag lässt die Position unverändert.

## 13. Spieler und Anmeldung
Der Admin legt Spieler (Name, Avatar, optional „Duo“) an. Beim Öffnen erscheinen Namenskacheln. Antippen = angemeldet (Browser merkt sich das). Button „Spieler wechseln“ immer sichtbar. Kein Passwort, keine E-Mail. Einstellungen pro Spieler: Schriftgröße, Notizstufe, Rätselstufe, Erklärungen an/aus, Dunkelmodus.

## 14. Prolog-Plan (Tag 1–5)
Begleiter-NPC „Page“ erklärt in Sprechblasen jeweils eine Funktion (abschaltbar).
| Tag | Lernziel | Aktionen | Mini-Ziel |
|---|---|---|---|
| 1 | Ankommen, Zeitung, Karte, Raumwechsel | 1 (geführt) | Zimmer beziehen, Rezeption befragen |
| 2 | Befragen, Aussage vs. Fakt, Hotelbuch | 2 | Stollen-Vorfall: erste Aussagen sammeln |
| 3 | Untersuchen, Fallakte, Auffälligkeit | 2 | Eine Spur zum Stollen finden |
| 4 | Gegenstände benutzen, erstes Objekt-Rätsel | 3 | Schublade öffnen |
| 5 | Raster, Zeitstrahl, Widerspruch, Theorie | 3 | Stollen-Fall lösen (2 Fragen, +10 Punkte) |
Der Stollen-Fall ist ein eigener Mini-Fall ohne Bezug zur Hauptlösung, nutzt aber dieselben Mechaniken und Figuren, die später verdächtig sind.
