// Stub: scans app/dist for marker strings that must never ship in the bundle.
// Real markers (test case + solution IDs) are added with WP02/WP03.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MARKERS = ['__CASE_MARKER__', '__SOLUTION_MARKER__'];
const dist = process.argv[2] ?? 'app/dist';

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

if (!existsSync(dist)) {
  console.error(`check-bundle: ${dist} not found, run the build first`);
  process.exit(1);
}
const hits = [];
for (const file of walk(dist)) {
  const text = readFileSync(file, 'utf8');
  for (const m of MARKERS) if (text.includes(m)) hits.push(`${file}: ${m}`);
}
if (hits.length) {
  console.error('check-bundle: forbidden markers found:\n' + hits.join('\n'));
  process.exit(1);
}
console.log('check-bundle: ok');
