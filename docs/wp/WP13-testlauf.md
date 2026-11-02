# WP13 – Testlauf

**Ziel:** Das ganze Spiel in Zeitraffer durchspielen und Fehler finden, bevor die Spieler es tun.
**Lies:** `docs/07-solver-und-simulator.md` (§5), `docs/08-roadmap.md` (Abnahme M4).
**Abhängig von:** M2, M3

## Ablauf
1. Staging mit Berghotel-Fall laden, 4 Testspieler anlegen (Mensch + Agenten-Skripte).
2. Zeitraffer: Tag 1–24 durchlaufen, pro Spieler ein Bot-Profil (optimal, greedy, random, worst).
3. Prüfen: Zeitung jeden Tag erzeugt, Gerüchte erst ab 3 Spielern, Plaketten einmalig, Zeugnisse an Tag 10/14/18/22, Finale, Auflösung nur nach Abgabe + Tag 24.
4. Menschen-Test: zwei Personen spielen echte Tage (die Familie ≥60 und ein Freund), Rückmeldungen als Liste.
5. Werte justieren: Aktionsbudget, Quellenverteilung, Punkte (Eintrag im Entscheidungslog).

## Abnahme
- Keine kritischen Fehler offen (Datenverlust, falsche Punkte, Spoiler, Totalausfall).
- Bot-Ziele laut `07` §5 erreicht.
- Dauer-Messung: durchschnittlicher Spieltag ≤10 Minuten bei den Menschen-Testern.
- Liste „Bekannte Mängel“ (≤10 Zeilen) in `STATUS.md`.

## Nicht tun
Keine neuen Funktionen. Priorität: Datenintegrität, Spoilerfreiheit, Verständlichkeit.
