# WP10b – Inhalt-Umbau: Lügennetz, Dokumente, Dialoge, Tagesbogen

**Ziel:** Der Fall Berghotel nutzt das Erkunden-Format und erzeugt Aha-Momente.
**Lies:** `docs/02b-erkunden.md`, `docs/04-fall-und-inhalte.md` §5b, §6, §7, `docs/07-solver-und-simulator.md` §2b.
**Abhängig von:** WP06c (Schemas). Läuft als **Sub-Agent** parallel zu WP06d. Fasst nur `cases/` und `config/profiles/` an.

## Ablauf (gezielt patchen, den Fall nie komplett neu erzeugen)
1. **Lügennetz:** Je Figur `secret` und ≥1 `lie` mit `reason`. Zeugenverweise (jede Figur von ≥2 anderen erwähnt). Muster nach `02b` §5.
2. **Quellen → Dinge/Dokumente/Gespräche:** Urteils-Texte umschreiben in Beobachtungen und Szenen. Zettel, Briefe, Fotos, Quittungen als Dokumente (≤60 Wörter).
3. **Dialoge** mit `shows` (Beweis vorlegen) und `witness_of`.
4. **Verknüpfungen** (`links`) und Déjà-vu: mindestens eine pro Woche je Schwerpunktfigur.
5. **Tagesbogen** (`beats`) für Tag 1–24: Aha-Moment, Erkenntnis, Faden für morgen.
6. **Raum-Ketten** (Schlüssel → Schublade → Zettel → Code → Safe) je Raum, über mehrere Tage.
7. Verteilung auf Raum-Tage: 4–7 Entdeckungen je Raum/Tag, Tempo-Fenster Tag 20–21 halten.
8. Familienprofil einzeln validieren.

## Abnahme
- `validate-case` für friends und family grün inkl. §2b, `npm run balance` im Soll.
- Stichprobe (Zahlen, keine Lösungsdetails): Anteil Dokumente, Dialoge mit `shows`, Zahl der Verknüpfungen, Lügen je Figur.
- Keine Lösung in Chat, Doku, Commits.

## Nicht tun
Keinen Code ändern. Keine Urteils-Texte („war es nicht“). Berichte höchstens 15 Zeilen ohne Lösungsbezug.
