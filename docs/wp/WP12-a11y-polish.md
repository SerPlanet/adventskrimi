# WP12 – Barrierefreiheit und Feinschliff

**Ziel:** Das Spiel ist für 10- bis 80-Jährige angenehm bedienbar.
**Lies:** `docs/05-ui-und-barrierefreiheit.md` (Checkliste), `docs/01-vision-und-scope.md` (Erfolgskriterien).
**Abhängig von:** WP08

## Lieferumfang
- Durchgang aller Screens mit der Checkliste, Behebung der Funde (Schrift, Kontrast, Touch-Ziele, Fokus, Labels, Bestätigungsdialoge).
- Texte in einfache Sprache prüfen (Wort-/Satzlängen-Check über alle UI-Texte, Skript).
- Dunkelmodus, `prefers-reduced-motion`, Fehlermeldungen und Offline-Verhalten.
- Ladezeit Startseite ≤2 s auf 4G, kein Layout-Sprung.
- Optional (Could): Vorlesen-Knopf (Browser-Sprachausgabe).
- Kurze, in der App sichtbare Erklärung „So funktioniert’s“ (≤10 Sätze) und Hilfeknopf „Ich komme nicht weiter“.

## Abnahme
- Lighthouse Barrierefreiheit ≥95 auf Zeitung, Hotel, Akte, Zeitstrahl (Handy).
- Playwright-Smoke grün in Chromium und WebKit.
- Manueller Test durch den Menschen mit einer Person ≥60 Jahre dokumentiert (3 Zeilen in `STATUS.md`).

## Nicht tun
Keine neuen Funktionen. Keine Redesigns, nur Behebung gefundener Probleme.
