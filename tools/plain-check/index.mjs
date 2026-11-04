// Usage: npm run plain   Plain-language check over UI texts in app/src: long sentences and words.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_WORDS = 20;
const MAX_WORD = 20;
const files = [];
const walk = (d) =>
  readdirSync(d).forEach((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) files.push(p);
  });
walk('app/src');
let bad = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const texts = [...src.matchAll(/>([^<>{}]{15,})</g)].map((m) => m[1]);
  texts.push(...[...src.matchAll(/'([^'\n]{25,})'/g)].map((m) => m[1]));
  const isCode = (x) => /[;=(){}|&]|\[|\]/.test(x) || /^\s*\/\//.test(x);
  for (const t of texts.filter((x) => !isCode(x))) {
    for (const s of t.split(/(?<=[.!?])\s+/)) {
      const words = s.trim().split(/\s+/);
      if (words.length > MAX_WORDS || words.some((w) => w.replace(/\W/g, '').length > MAX_WORD)) {
        console.log(`${f}: ${words.length} Wörter: ${s.trim().slice(0, 70)}`);
        bad++;
      }
    }
  }
}
console.log(bad ? `${bad} Fundstellen` : 'ok');
process.exit(bad ? 1 : 0);
