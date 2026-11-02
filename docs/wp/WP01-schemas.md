# WP01 – Schemas und Datenbank

**Ziel:** Alle Datenformate als Zod-Schemas, DB-Migrationen, Testfall.
**Lies:** `docs/04-fall-und-inhalte.md` (§3–§6), `docs/06-architektur.md` (Datenmodell).
**Abhängig von:** WP00

## Lieferumfang
- `packages/engine/src/schemas/`: Zod-Schemas + Typen für alle YAML-Dateien aus `04` §3, für `config/profiles/*.yaml` und `config/scoring.json`, `config/quality.json`.
- YAML-Loader (`loadCase(path)`), der Schemas anwendet und Referenzen prüft.
- `supabase/migrations/`: alle Tabellen aus `06`, RLS gesperrt für `anon`/`authenticated`.
- `tools/load-case`: schreibt validierte Fall-Daten in die `case_*`-Tabellen.
- `config/profiles/family.yaml`, `friends.yaml`, `config/scoring.json` (Werte aus `03`), `config/quality.json` (Werte aus `07`).
- `cases/_test/`: kleiner Fall (2 Räume, 3 NPCs, 2 Kategorien-Kandidaten je Gruppe, triviale Lösung, ≥1 Rätsel, ≥1 Lüge) ohne Spoilerwert.

## Abnahme
- `npm run validate-schema -- cases/_test` grün, Fehlerfall (kaputte Referenz) wird klar gemeldet.
- Migration auf Staging läuft durch, `load-case` füllt `_test`.
- Tests für Schemas (gültig/ungültig).

## Nicht tun
Keine Solver-Logik (WP02), keine Fall-Inhalte für Berghotel.
