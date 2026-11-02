# WP14 – Launch

**Ziel:** Produktion bereit, Spieler angelegt, Spielstart 1.12.
**Lies:** `docs/06-architektur.md` (Betrieb), `docs/01-vision-und-scope.md`.
**Abhängig von:** WP13

## Lieferumfang
- Prod-Supabase mit Migrationen, Fall geladen (`load-case`), `GAME_NOW_OVERRIDE` entfernt, Admin-Token gesetzt.
- Zwei Spiele anlegen (Freunde, Familie) mit `start_date = 2026-12-01`, Profile gesetzt.
- Spieler anlegen laut Liste des Menschen; Namenskacheln prüfen.
- GitHub-Pages-Prod-Deployment, URL prüfen. `tools/check-bundle` gegen Prod-Build.
- Keep-Alive für Supabase (täglicher Aufruf ab jetzt), Backup-Export einmal testen.
- Launch-Checkliste (max. 15 Punkte) in `STATUS.md`, Code-Freeze 29.11., danach nur kritische Fixes.
- Text für den Menschen: „Link + Anleitung für Eltern/Oma“ (≤10 Zeilen), „Der erste Tag“ als Nachricht an den Gruppenchat.

## Abnahme
- Trockenlauf auf Prod mit einem Testspieler (danach löschen und Spiel zurücksetzen).
- Spieler öffnen den Link am 1.12. 0:00 und sehen Tag 1.
- Rückfallplan dokumentiert (3 Zeilen): Wenn der Server ausfällt, wie erfährt es der Mensch, was tut er.

## Nicht tun
Keine Änderungen am Fall nach dem Freeze, außer kritische Fehler. Kein Reset des Spiels nach dem 1.12. ohne ausdrückliche Anweisung des Menschen.
