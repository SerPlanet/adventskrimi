# WP21 – UI-Fluss: Gute Nacht, nächster Tag, Zeitung zuerst, Rolle

**Ziel:** Nach „Tag beenden“ hängt nichts mehr. Das Detektiv-Thema ist spürbar. **Lies:** `docs/02c` §1, §9, `docs/05`. **Abhängig von:** WP20 (API, `unlock`, Rolle in der Konfiguration).

## Umfang
1. **Gute-Nacht-Screen:** Erzähltext (Feld `abend` je Raum/Tag, Fallback Standardtext), „Heute: n Gespräche, n Funde“, Statuschip. Akte bleibt erreichbar, Tag-Reiter nur lesend.
2. **Zeit:** Wenn der nächste Tag schon spielbar ist (Nachholer), erscheint **„Zum nächsten Tag“**. Danach läuft die Reihenfolge Erzähltext → Zeitung (Reiter „Zeitung“ aktiv). Sonst steht dort „Morgen ab 0 Uhr“. Kalendertag nach Invariante 11, Datums-Override nur Staging.
3. **Zeitungsrätsel** (z. B. Sudoku Tag 1) sind nach dem Kalendertag lösbar. Die UI zeigt „Spätlösung: Punkte ×0,75“ (Wert aus der Konfiguration, ohne Minuszeichen und ohne Warnton).
4. **Rolle:** Beim ersten Öffnen nach der Namenskachel eine Karte „Wer bist du?“ mit den Rollen des Profils. Vorgabe durch die Verwaltung möglich, Wechsel bis Ende Tag 1, ohne Passwort. Anrede und Erzähltext nutzen die Rolle.
5. **Detektiv-Thema:** Notizbuch-Skin für die Akte, Detektiv-Kommentar bei „Ansehen“, Brett erst nach der Schlüsselfrage sichtbar (`unlock`), Anzeige „Aktionen übrig (x/y)“ nach `actions_by_day`.
6. Keine Routen-/Raumwahl mehr in Tag 1–5 (Altweg löschen).

## Abnahme
- Playwright: Tag 1 beenden → Gute-Nacht-Screen, Nachholer klickt „Zum nächsten Tag“ → Zeitung (nach Erzähltext). Nicht-Nachholer sieht „Morgen ab 0 Uhr“.
- Spätlösung: Rätsel am Folgetag lösbar, Punkte = Rätselwert × Faktor aus `config/`.
- Rollenkarte erscheint einmal. A11y-Check (`docs/05`), 360/768/1440 px ohne Querscroll, `knip` sauber.

## Nicht tun
Neue Spielfunktionen, Chat, Passwort. Keine Texte außer UI-Texten (Inhalt ist WP22/WP23).
