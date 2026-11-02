# WP11 – Admin-Ansicht (Beobachter)

**Ziel:** Der Mensch kann das Spiel beobachten und betreuen, ohne Spoiler.
**Lies:** `docs/06-architektur.md` (API `admin_*`), `docs/01-vision-und-scope.md` (Beobachter).
**Abhängig von:** WP05

## Lieferumfang
- Admin-Seite hinter einem geheimen Admin-Token (Header, kein Konto), nicht verlinkt.
- Spieler anlegen/ändern/deaktivieren (Name, Avatar, Duo, Profil).
- Übersicht: je Spieler Tage gespielt, Funde, Punkte, zuletzt aktiv, ob Anklage abgegeben. **Keine** Theorie-Inhalte und keine Lösung (Spoiler-Schalter nur über Umgebungsvariable, standardmäßig aus).
- Knöpfe: Zeugnis auslösen, „Gemeinsames Finale“ freischalten, Zeitung des Tages neu erzeugen (nie Punkte), Export (JSON).
- Staging: Zeitraffer-Regler (setzt `GAME_NOW_OVERRIDE`), Spiel zurücksetzen.
- Anzeige „Heute ist Tag N“ und Systemzeit.

## Abnahme
- Ohne Token kein Zugriff (Test). Prod-Zeitraffer nicht verfügbar (Test).
- Admin-Antworten enthalten nie Lösung oder Theorien.
