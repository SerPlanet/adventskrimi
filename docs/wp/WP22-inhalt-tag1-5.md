# WP22 – Inhalt Tag 1–5 (Sub-Agent, Fleißarbeit)

**Ziel:** Geführte Tage mit Lobby, Rezeption, Brett, Flurwegen, Zimmer (Tag 3) und der Präsentation der Schneekugel (Tag 5). **Lies:** WP20 §1, §2, §5, `docs/02b` §5, `02c`. **Abhängig von:** WP20 (Schema). **Fasst nur `cases/` an.** Der Sub-Agent bekommt: Ziel, Pfade, Abnahme, „Ergebnis in ≤15 Zeilen“.

## Inhalt
1. **Tag 1:** Erzähltext (Rolle, Ankunft, Auftrag). Zeitung (3 Artikel: Ausstellung, Gastgeber, Gäste als Gruppe, nicht namentlich). Rezeption mit 3 freien Fragen (Ausstellung, Gäste, Schlüssel). Brett erst nach der Schlüsselfrage (1 Tutorial-Aktion). Prospekt als Dokument. Die Frage nach der Diebesnacht gibt es erst ab Tag 6.
2. **Tag 2:** Rezeptionsgespräch erweitert (`asked` + `day_from: 2`). Je Flur 1 Raum mit 3 untersuchbaren Dingen (Budget 2). Erste Behauptung als Zettel („Tom kommt erst am 6.“), gekennzeichnet als Behauptung, ohne Wirkung. Jede Aktion liefert Interessantes.
3. **Tag 3:** Zimmer je Flur (`zimmer_template`). **Tag 4:** Raum je Flur. **Tag 5:** gemeinsamer Raum, Schneekugel wird gezeigt.
4. **Je Flur gleiche Menge** (z. B. 2 Aussagen + 1 Fakt je Tag), aber verschiedene Texte. Mindestens 5–7 Verdächtige, jeder mit offenem oder verstecktem Motiv. NPCs vor allem Mitarbeiter und Besitzer, Gäste nur als Gruppe.
5. `insights.yaml` für Tag 1–5 anlegen und jeden Beleg mit `supports` versehen (Muster WP20 §5). Mindestens 2 Belege je Erkenntnis, einer davon darf aus Tag 6+ stammen.
6. `look_note` je Ding (kurzer Detektiv-Kommentar, kein Urteil), `abend` je Tag.

## Abnahme
`validate-case` grün für die Regeln 1–6 und 8 (soweit Tag 1–5 betroffen), Zahlen-Stichprobe (Belege je Flur und Tag), keine Lösungsdetails im Bericht. Texte ≤60 Wörter, Du-Form, einfache Sprache (`npm run plain`).

## Nicht tun
`cases/berghotel/` komplett neu erzeugen: nur ergänzen und ändern, was der Validator beanstandet. Keine Urteile. Kein Code.
