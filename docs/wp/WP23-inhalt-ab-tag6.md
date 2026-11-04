# WP23 – Inhalt ab Tag 6 (Sub-Agent, Fleißarbeit)

**Ziel:** Freie Phase mit ~8 Räumen, mehr Dingen als Budget, Passwort-Ketten und der Zeitung als einziger tagesgebundener Quelle. **Lies:** WP20, `docs/02b` §5–§8, `02c` §5. **Abhängig von:** WP20, WP22 (Tag 1–5 fix). **Fasst nur `cases/` an.**

## Inhalt
1. **Räume:** je Raum ≥ Budget+1 untersuchbare Dinge (Freunde 4, Familie 3 → 5). Davon ≈3 mit direktem Beleg, 1 Passwort-Kette, 1 Motiv-Detail. Jede Aktion liefert einen Beleg. Wer sein Budget in einem Raum ausgibt, bekommt trotzdem Verwertbares.
2. **Ketten:** Aktion in Raum A liefert das Passwort für Raum B (`Source.lock`). Keine Sperrräume, keine Tagestore (D75). Jeder Raum ist ab Tag 6 sonst frei.
3. **Erkenntnis-Kette:** ~12 Erkenntnisse (`needs`), je 3–4 Belege in verschiedener Form (Aussage, Fakt, Beobachtung, Dokument). Hinweise der anderen Flure liegen hier. Nur etwa 60 % der Belege sind für die Lösung nötig.
4. **Gespräche:** Fragen mit `unlock` (Zeigen eines Fundes, Vorfrage). Diebesnacht-Fragen ab `day_from: 6`. Jede Figur lügt oder verschweigt aus einem entdeckbaren Grund (`02b` §5). Wer lügt, war nicht automatisch der Täter.
5. **Zeitung Tag 6–24:** 3–5 Artikel je Tag, nur Fakten, mit Hinweisen. Ein Zeitungsbeleg ist nie der einzige Beleg.
6. Zielrichtung: **verständlich und gut lösbar**. Im Zweifel einfacher formulieren, der Mensch regelt nach seinem Durchspielen nach.

## Abnahme
`validate-case` (alle 8 Regeln aus WP20) und `balance` laufen. Lösetag wird nur berichtet, nicht angepasst. Zahlen-Stichprobe (Dinge je Raum, Belege je Erkenntnis), keine Lösungsdetails.

## Nicht tun
Tagestore oder Sperrräume „vorsichtshalber“. Urteile in Belegen. Tag 1–5 verändern.
