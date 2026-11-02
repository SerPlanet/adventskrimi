# WP04 – Simulator und Bots

**Ziel:** Balance belegen statt raten.
**Lies:** `docs/07-solver-und-simulator.md` (§4–§6).
**Abhängig von:** WP02, WP03

## Lieferumfang
- `tools/simulate <fall> --profile <p> --bot <name> [--seeds N]` mit Bots `optimal`, `greedy`, `random`, `newspaper_only`, `worst`.
- Kurzbericht (≤20 Zeilen) laut `07` §4, plus `--json` für Vergleiche.
- Prüfskript `npm run balance`: führt alle Bots für beide Profile aus und meldet Verstöße gegen `07` §5.
- Der Planer aus WP02 nutzt jetzt die echte Engine.

## Abnahme
- Auf `_test` laufen alle Bots durch, Bericht plausibel.
- Auf dem fertigen Fall (nach WP10) erfüllt jedes Profil `07` §5, sonst ist die Verletzung klar benannt.
- Laufzeit je Bot-Lauf ≤30 s, 100 Zufalls-Seeds ≤2 min.

## Nicht tun
Keine Fall-Inhalte ändern. Verstöße melden. Die Reparatur gehört zu WP10/WP13.
