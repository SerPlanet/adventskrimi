# 01 – Vision und Scope

## Ziel
Ein Advents-Krimispiel, bei dem jeder Spieler jeden Tag ≤10 Minuten ermittelt, sich auf den nächsten Tag freut und am 24.12. eine Anklage abgibt. Eine Rangliste sorgt für freundlichen Wettbewerb. Am Ende versteht jeder die Auflösung, auch wer falsch lag.

## Zielgruppen
| | Freunde | Familie |
|---|---|---|
| Spieler | ~4, Alter jung bis mittel | variabel (Haushalte, auch Duos an einem Gerät), 10–80 Jahre |
| Anspruch | höher: mehr Räume, Verdächtige, Aktionen | niedriger: kleinere Fallversion, mehr Hilfen |
| Technik | Handy/PC | Handy, Tablet, PC; oft wenig Technik-Erfahrung |

Beide Profile nutzen dieselbe Engine, dieselbe Geschichte und denselben Fall (Familie = abgespeckte Teilmenge). Details: `04-fall-und-inhalte.md`.

## Rahmen
- Kickoff 2.11.2026, Code-Freeze 29.11., Spielstart 1.12., Finale 24.12.
- Nebenher Uni: kleine WPs, klare Abnahme, Menschen-Aufgaben minimal.
- Der Mensch ist Beobachter (Admin-Ansicht), spielt nicht mit und soll die Lösung nicht kennen.

## Prinzipien
1. Kurz: Tag ≤10 Minuten. 2. Fair: jeder kann Boden erreichen, Decke erreicht nur, wer gut plant. 3. Freundlich: keine Minuspunkte, Streaks, Strafen. 4. Einfach: kein Passwort, große Bedienelemente. 5. Daten statt Code: Regeln, Fälle, Zahlen sind Konfiguration. 6. Prüfbar: Solver und Bots beweisen Lösbarkeit und Balance.

## Nicht-Ziele (v1)
Chat im Spiel · Hinweise an Mitspieler schenken/teilen · Beschatten · Lügen/Sabotage zwischen Spielern · Streaks, Verlustangst, Verfall · Passwörter/Registrierung · native App · Push-Benachrichtigungen (der Mensch erinnert im Gruppenchat) · Echtzeit-Mehrspieler · Wetten · Mitspielen des Menschen.

## Priorität (MoSCoW)
- **Must:** Namenskachel-Anmeldung, Zeitung, Hotel-Karte und Räume, Aktionen (Befragen/Untersuchen/Benutzen), Fallakte, Raster, Zeitstrahl, Theorie, Rätsel des Tages, Punkte und Rangliste, Wochenzeugnis, Finale, Prolog (Tag 1–5), Fall Berghotel (Familie + Freunde), Solver/Validator, Admin-Ansicht (Lesen).
- **Should:** Notizstufen (Auto/Halb/Manuell), Objekt-Rätsel, Erstentdecker-Plaketten, Gerüchte in der Zeitung, Simulator mit Bots.
- **Could:** Frühanklage-Bonus, Vorlesen (Browser-TTS), Dunkelmodus, Schach-Rätsel.

## Kürzungsreihenfolge bei Zeitnot (zuerst streichen)
1. Frühanklage 2. Schach-Rätsel 3. Objekt-Rätsel (feste Schlösser entfallen, Quelle liefert direkt) 4. Plaketten 5. Gerüchte 6. Notizstufe „Halb“ 7. Freunde-Vollversion (Familienprofil bleibt, Freunde spielen Familienprofil mit höherer Schwierigkeit).

## Fallback
Meilenstein M1 („Kalender-Light“: Profil, Zeitung, Rätsel des Tages, Rangliste) wird früh veröffentlicht. Fällt der Krimi aus, läuft das Spiel als Rätselkalender mit Rangliste weiter.

## Erfolgskriterien
- Alle Spieler können in der ersten Woche selbstständig spielen (ohne Hilfe des Menschen).
- Kein Spieltag >10 Minuten (Messung: Wortzahl-Check + Testlauf).
- Der schlechteste Bot-Spieler kommt auf höchstens 3 Kandidaten je Kategorie (`07`).
- Kein Spoiler im Client; kein Totalausfall des Servers im Dezember.
