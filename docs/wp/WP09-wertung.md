# WP09 – Wertung, Rangliste, Finale

**Ziel:** Punkte, Rangliste, Zeugnisse, Anklage, Auflösung.
**Lies:** `docs/03-punkte-und-wettbewerb.md`, `docs/02-spielregeln.md` §11.
**Abhängig von:** WP05, WP06 (Teil 1), WP08 (Teil 2)

## Teil 1 (für M1)
- Rangliste-Screen (Gesamtliste, eigene Zeile und Nachbarn hervorgehoben, Ränge), Plaketten-Sammlung, „Ermittler des Tages“.
- Ledger-Anzeige „Meine Punkte“ (woher kamen sie).
- Gemeinschaftsbalken (Should).

## Teil 2
- **Wochenzeugnis** an Tag 10/14/18/22: erzeugt beim ersten Aufruf nach Tagesende, Admin-Knopf als Sicherheitsnetz, Punkte je Kategorie.
- **Anklage:** Formular (Theorie + 2 Beweisfragen), Bestätigungsdialog in einfacher Sprache, danach unveränderlich. **Frühanklage** ab `early_accusation_from_day` (Standard 20, beide Profile) per Konfigschalter mit Bonus, Zeitungsnotiz „X hat Anklage erhoben“.
- **Auflösung:** nur nach eigener Abgabe und ab Tag 24, erzählte Geschichte in Kapiteln, dann Punkteübersicht. „Gemeinsames Finale“ (Admin schaltet Rangliste groß frei).
- Auszeichnungen ohne Punkte (Could).

## Abnahme
- Tests: Lösung wird nie vor Bedingung geliefert (Serverantwort geprüft). Frühanklage-Formel stimmt. Punkte doppelt vergeben unmöglich. Nachzügler bekommen keinen Frühbonus.
- Zeitraffer in Staging: Tag 1–24 durchspielen mit `_test`, Finale erreichbar.

## Nicht tun
Keine Änderung der Punktewerte ohne Eintrag im Entscheidungslog. Werte kommen aus `config/scoring.json`.
