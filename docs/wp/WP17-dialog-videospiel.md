# WP17 – Gespräche wie im Videospiel

**Ziel:** Tippen auf eine Person startet sofort den Dialog. **Lies:** `docs/02c-tagesablauf-v2.md` §6, `docs/05` (Popups).
**Abhängig von:** WP16.

## Lieferumfang
- Dialog-Ansicht (Sprechblasen, Figur sichtbar): Fragenliste, jede Frage hat eine Antwort (auch „Dazu weiß ich nichts.“), „Zeigen“ eines Funds öffnet weitere Fragen. Kostenlos.
- Jede Antwort mit **„In die Akte legen“** (einzeln). Verlauf speichert das Gespräch.
- Tastatur- und Screenreader-tauglich, Fokus-Falle, Esc schließt.
- Daten: alle Themen haben Antworten (Validator: kein Thema ohne Antwort, ≤60 Wörter je Antwort).
- Playwright-Test: Dialog öffnen, Frage wählen, Antwort einlegen.

## Nicht tun
Keine Inhaltsänderung außer Lückenfüllung („weiß ich nicht“-Antworten).
