# WP19 – Zeitung als Geschichte (Inhalt) und Erzähltext-Bausteine

**Ziel:** Jeden Tag ist die Zeitung nett zu lesen und trägt Hinweise als Geschichten. **Lies:** `docs/02c-tagesablauf-v2.md` §2, §3, `docs/04` §5c, `docs/07` §2b.
**Abhängig von:** WP16 (Schema). Läuft als **Sub-Agent** parallel zu WP17/WP18. Fasst nur `cases/` an.

## Ablauf (gezielt, nichts neu erzeugen)
1. `newspaper.yaml`: Tag 1–24 je 3–5 Artikel mit Titel und 50–100 Wörtern. Mischung aus Klatsch ohne Bedeutung und Hintergrund. **Nur Fakten.** Beziehungen als Geschichte („Der Laden der Brüder Tom und Tilo …“), `relation` in den Fakten.
2. Je Artikel `traegt` (Fakt-IDs), Wortzahl, keine Urteile, keine Platzhalter-Reste.
3. `abgang`/`ankunft` je Raum (1–2 Sätze), Tageszeit/Wetter je Tag.
4. Validator: Zeitung nur Fakten, jede Beziehung ist in mindestens einer Zeitung oder einem Gespräch erzählt, Artikel-Wortgrenzen.

## Abnahme
`validate-case` und `npm run balance` grün. Stichprobe mit Zahlen (Artikel je Tag, Wortzahl, Anteil Klatsch vs. Hintergrund), keine Lösungsdetails.

## Nicht tun
Keinen Code ändern. Kein Spoiler.
