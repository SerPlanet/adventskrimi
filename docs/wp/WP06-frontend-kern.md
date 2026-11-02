# WP06 – Frontend-Kern

**Ziel:** Spielbarer Alltag: Namenswahl, Zeitung, Hotel, Aktionen, Akte, Einstellungen.
**Lies:** `docs/05-ui-und-barrierefreiheit.md`, `docs/02-spielregeln.md` §3–§8, §13.
**Abhängig von:** WP05

## Lieferumfang (`app/`)
- Spielwahl über den Hash-Link `/#/<slug>` (siehe `docs/06`, Abschnitt Spielwahl über den Link), Meldung bei fehlendem/unbekanntem Slug. Migration: Spalte `games.slug` (unique).
- Routing, Layout, untere Navigation, Spielerwechsel, Einstellungen (Schrift, Notizstufe, Rätselstufe, Erklärungen, Dunkelmodus).
- Screens: Namenswahl, Zeitung, Hotel (Karte, Raumansicht, Aktionsleiste), Gespräch/Untersuchung (Karten), Akte (Filter, Suche, Inventar, Hotelbuch).
- „Ansehen gratis“ mit Auffälligkeitsmarkern, Atmosphäre-Meldung bei leeren Aktionen, Anzeige „Aktionen übrig“.
- Tag beenden mit Raumwahl und Bestätigung. Nachholen: „Nächster Tag“-Ablauf, Zeitungen früherer Tage lesbar.
- Prolog-Begleiter „Page“ (Sprechblasen, abschaltbar).
- Pro Screen die Barrierefreiheits-Checkliste aus `05`.

## Umgesetzt (Stand)
Route `#/<slug>/<tab>`, Namenskacheln pro Spiel, Zeitung mit Frage des Tages, Hotel, Akte (Funde, Gegenstände, Hotelbuch), Rangliste, Einstellungen, Page. Test-Uhr in Staging: `?now=2026-12-02T12:00:00+01:00`.

## Abnahme
- Auf Staging mit `_test`: Durchlauf Namenswahl → Zeitung → Aktion → Akte → Tag beenden → nächster Tag (Zeitraffer).
- Playwright-Smoke dafür grün.
- Lighthouse-Barrierefreiheit ≥90 auf Zeitung und Hotel (Handy-Profil).
- Kein Layoutbruch bei Schriftgröße „sehr groß“ bei 360 px.

## Nicht tun
Noch kein Raster/Zeitstrahl (WP08), keine Rätsel (WP07). Keine Fall-Daten im Bundle.
