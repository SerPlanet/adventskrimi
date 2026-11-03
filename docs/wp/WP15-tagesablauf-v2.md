# WP15 – Tagesablauf v2: Erzähltext, Statuschip, Raum ohne Rätselliste

**Ziel:** Der Tag fühlt sich geführt an. **Lies:** `docs/02c-tagesablauf-v2.md` §1, §2, §4, §9, `docs/05` (Tagesablauf v2).
**Abhängig von:** WP06h.

## Lieferumfang
- **Erzähltext** nach der Personenwahl: Generator aus Daten (`abgang`/`ankunft` je Raum, Wetter/Tageszeit, Echo der letzten Handlung ohne Spoiler). „Weiter“-Knopf, später im Reiter „Tag“ erneut lesbar. Prolog-Sonderfall Tag 1. Test: keine Platzhalter, keine Fall-Inhalte außer Raumstimmung.
- **Tag-Reiter:** Ort, wer ist im Raum (Namen), Statuschip **rot „Tag beendet“ / grün „Tag noch nicht abgeschlossen“**. Nach „Tag beenden“ bleibt die Seite, kein automatischer Sprung. Nachzügler: Knopf „Nächsten Tag spielen“.
- **Entfernen:** Bereich „Rätsel im Raum“ samt Datenfluss zum Client, wenn er verrät, welche Rätsel es gibt.
- Playwright-Test Tagesfluss, Lighthouse A11y ≥95, Screenshots bei 360 und 1440 px.

## Nicht tun
Keine Zeitungsinhalte (WP19), keine Akte (WP16), kein Dialog (WP17).
