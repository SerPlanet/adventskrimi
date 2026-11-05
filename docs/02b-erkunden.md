# 02b – Erkunden (Kern des Spiels)

Ersetzt das Aktionsbudget aus `02` §5. Gilt ab WP06c. Das Spiel fühlt sich an wie ein **Escape-Room-Krimi**: Räume ansehen, Dinge untersuchen, Dokumente lesen, Personen befragen, Widersprüche finden.

## 1. Tagesablauf (≤10 Min.)
1. Zeitung lesen. 2. Du bist in **einem Raum** (Wahl am Vorabend, Bewegung wie in `02` §4). 3. **Frei erkunden**, alles ist kostenlos. 4. Fortschrittsanzeige „5 von 7 entdeckt“. 5. Rätsel des Tages (optional). 6. „Gute Nacht“: Raum für morgen wählen.
**Ansehen ist frei, genaues Untersuchen kostet eine Aktion.** Es gibt ein kleines Tagesbudget (Konfiguration, Start: Familie 3, Freunde 3, Prolog 1–2). Das UI zeigt immer „Aktionen übrig (1/2)“. Kostenlos sind: Dinge ansehen (Nahansicht, Beschreibung), Gespräche, Zeigen eines Fundes, Dokumente lesen und erneut lesen, Gegenstände im Inventar ansehen. Eine Aktion kostet nur der Knopf „Genauer untersuchen“, und **nur wenn es etwas Neues liefert**. Der Knopf erscheint nur bei Dingen, an denen es heute etwas zu finden gibt, sonst steht dort nur die Beschreibung. Die Entscheidung des Spielers: welcher Raum, welche Dinge er genauer untersucht, was er daraus schließt.
Es gibt drei Klassen von Dingen: **Deko** (nicht anklickbar, nur Bild), **Ansehen** (anklickbar, Nahansicht und Beschreibung, frei) und **Untersuchbar** (Nahansicht plus Knopf „Genauer untersuchen“, 1 Aktion).

## 2. Ebenen eines Dings
| Ebene | Was passiert | Visuelles Feedback |
|---|---|---|
| L0 Ansehen | Nahansicht, Beschreibung (immer frei) | Ding groß in einem Zustand (zu) |
| L1 Genauer untersuchen (**1 Aktion**) | Zustand ändert sich: Tür auf, Pinnwand anheben, Schublade ziehen | Anderer Zustand (auf), Dokument/Gegenstand sichtbar |
| L2 Benutzen/Zeigen | Gegenstand auf Ding oder Person anwenden | Ergebnis sichtbar (Schloss springt auf, Person reagiert) |
Nur L1 kostet eine Aktion (und nur bei Erfolg). **Keine „!“-Markierungen im Bild.** Anklickbare Dinge werden beim Darüberfahren/Fokus hervorgehoben, und ein Knopf „Umsehen“ lässt alle anklickbaren Dinge kurz aufleuchten (für Touch).

## 3. Funde
- **Dokument** (Zettel, Brief, Foto, Quittung): „Einstecken“ legt es in das Inventar. Es ist **jederzeit im Volltext erneut lesbar**. Die Akte zeigt nur Titel, Fundort und Tag.
- **Gegenstand** (Schlüssel, Schuhe): Inventar, Nahansicht, benutzbar.
- **Gespräch:** Protokoll „Gespräch mit X (Tag n)“ mit Volltext in der Akte.
- **Beobachtung:** als Szene oder Text („Schneespuren vor der Seitentür, Größe 44“), nie als Urteil.
**Nie automatisch** werden Dokumente und Beobachtungen in Raster oder Zeitstrahl übertragen. Der Spieler liest und trägt selbst ein. Nur die Notizstufe „Auto“ darf **Gesprächsaussagen** vorschlagen (siehe `02` §8).
**Textregel:** Kein Fund nennt ein Urteil („Ben war es nicht“, „Tom ist unschuldig“). Der Schluss entsteht beim Spieler.

## 4. Gespräche
Kostenlos und beliebig oft, damit sie Geschichte erzählen. Themen-Chips. **Zeigen:** Einen Fund aus dem Inventar vorlegen und neue Antworten bekommen. **Zeugenverweise** entstehen im Gespräch („Fragen Sie Silvia, sie war dabei“) und öffnen neue Themen bei Silvia. Zeugen können Aussagen **bestätigen oder widerlegen**.

## 5. Lügennetz (Glass-Onion-Prinzip)
- **Jede Figur lügt oder verschweigt mindestens einmal.** Jede Lüge hat einen **Grund** (Affäre, verbotener Kuchen, Schulden, Schlafwandeln), den der Spieler entdecken und nachvollziehen kann (≥2 Wege).
- Die Lüge des Diebes ist eine unter vielen. Die anderen Lügen sind harmlos, aber dem Spieler nicht sofort erkennbar.
- Muster, das ständig entstehen soll: *Tom sagt, er war um 1 im Bad. Jonas sah Tom um 1 in der Bar. Jonas war zu der Zeit mit Silvia unterwegs.* → Der Spieler schließt: „Ich sollte mit Silvia reden, um Jonas’ Geschichte zu prüfen.“ Aussagen verweisen also aufeinander (Zeugen), jede Figur wird von mindestens 2 anderen erwähnt.
- Aufdeckung einer Lüge ist ein **Aha-Moment**: Man versteht danach die Person besser (Charakterbild).

## 6. Aha-Bausteine

> **Überholt durch `02c` §7:** Verknüpfen-Knopf, „Das erinnert dich an …“ und Déjà-vu entfallen. Aha-Momente entstehen aus Lesen und eigenem Schließen (Widersprüche zwischen Texten, Zeugen, Dokumenten). Die restlichen Bausteine bleiben als Gestaltungsregel für die Inhalte.

- **Widerspruch:** zwei Aussagen/Funde passen nicht (Zeitstrahl).
- **Bestätigung:** Zeuge bestätigt oder widerlegt.
- **Verknüpfung:** zwei Funde gehören zusammen (Fußspuren-Zettel ↔ Schuhe). Das System sagt nur „Das erinnert dich an …“, der Spieler bestätigt „Verknüpfen“ und bekommt Punkte.
- **Déjà-vu:** Ein neuer Fund verweist auf einen älteren Eintrag, den man übersehen hat („Ah, das wusste ich schon“).
- **Neudeutung:** Detail aus dem Prolog bekommt neuen Sinn.
**Tagesbogen:** Jeder Tag hat in den Daten einen `beat` (was der Spieler Neues versteht, welcher Aha-Moment eingeplant ist). Mindestens 1 neuer Fund pro besuchtem Raum, 1 Erfolg pro Tag (Rätsel, Verknüpfung, entlarvte Lüge) und ein Faden für morgen.

## 7. Escape-Room-Elemente
Schlösser (Zahlencode, Chiffre, Buchstaben), Kombinieren (Gegenstand + Ding), **Ketten pro Raum** über mehrere Tage (Schlüssel → Schublade → Zettel → Code → Safe), ein „Raumgeheimnis“ pro Raum. Kein Rätsel ist alleiniger Weg zu einer Schlüssel-Tatsache. Höchstens 3 Min.

## 8. Pacing und Boden
Tempo kommt aus **Raumwahl pro Tag** und dem **kleinen Aktionsbudget** für genaues Untersuchen. Je Raum und Tag gibt es mehr untersuchbare Dinge als Aktionen (Wahl!), dazu freie Funde (Gespräche, Ansehen). Ziel bleibt: perfekter Spieler früheste Lösung Tag 20–21 (`07`). Der Boden kommt aus Redundanz, kostenlosen Gesprächen und Tipps. Ein Spieler geht nie leer aus: Jeder besuchte Raum liefert freie Funde, und jede Aktion liefert etwas.

## 9. UI-Bausteine (siehe `05`, WP06d)
Raumszene aus Vektor-Props (nur ein Teil anklickbar), Nahansicht mit Zuständen, Dokumentleser, Dialog mit Chips, Inventar-Leiste, Anzeige „Aktionen übrig (x/y)“, Hotspot-Liste für Tastatur und Screenreader.
