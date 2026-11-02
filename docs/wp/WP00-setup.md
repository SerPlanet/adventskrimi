# WP00 – Projekt-Setup

**Ziel:** Lauffähiges Gerüst, CI, zwei Umgebungen.
**Lies:** `docs/06-architektur.md` (Stack, Sicherheit, Repo-Struktur).
**Abhängig von:** –

## Lieferumfang
- Repo-Struktur laut `CLAUDE.md` §5 (leere Pakete mit `package.json`), npm workspaces, TypeScript strict, ESLint, Prettier, Vitest.
- `.gitignore` (inkl. `.env`, `dist`, `node_modules`), `.env.example` ohne Werte.
- `app/` zeigt eine Hello-Seite, baut mit `npm run build`.
- `supabase/` initialisiert (CLI-Konfiguration), Migrationspipeline lauffähig gegen Staging.
- CI (GitHub Actions): lint, Tests, Build, `tools/check-bundle` (zunächst Stub, der Marker sucht).
- Deployment von `app/` per GitHub Action nach GitHub Pages (Staging und Prod getrennt, z. B. zwei Pages-Umgebungen oder Staging lokal), Hello-Seite online.
- In `STATUS.md` die Menschen-Checkliste prüfen/ergänzen (Accounts, Keys).

## Abnahme
- `npm run lint && npm test && npm run build` laufen grün.
- Staging-URL zeigt die Hello-Seite.
- Eine leere Migration lässt sich auf Staging anwenden.

## Nicht tun
Keine Spiellogik, keine Fall-Inhalte, keine Secrets ins Repo. Wenn Accounts fehlen: Menschen-Checkliste, auf Antwort warten, nicht raten.
