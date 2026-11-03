# WP18 – Schlösser und Querverbindungen

**Ziel:** Rätsel sind Dinge in der Szene, die man findet; Schlösser verweisen auf andere Räume. **Lies:** `docs/02c-tagesablauf-v2.md` §5, `docs/04` §5c.
**Abhängig von:** WP17.

## Lieferumfang
- `lock` im Datenmodell (Typ, `hinweis_quelle`, `belohnung`, `versuchstext`). Beim Versuch erscheint der Versuchstext mit Hinweis auf die Fundstelle (z. B. Schlüsselbrett in der Lobby) oder bewusst ohne.
- Objekt-Rätsel (WP07) laufen als Schlösser im Raum, nicht mehr als Liste.
- Validator: jede Sperre hat Hinweisquelle oder bewusst `ohne_hinweis`, Belohnung ≥ „wichtig“, Querverbindung zu anderem Raum bei mindestens der Hälfte der Schlösser, kein Schloss ist alleiniger Weg zu einer Schlüssel-Tatsache.
- Tests und Playwright: Schrank versuchen → Hinweis, Schlüssel finden, Schrank öffnen.

## Nicht tun
Keine neuen Rätseltypen.
