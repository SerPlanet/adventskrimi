// Usage: npm run validate-schema -- cases/_test
import { loadCase, loadProfile, loadScoring, loadQuality } from '../../packages/engine/src/loader';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: validate-schema <case-dir>');
  process.exit(2);
}
let failed = false;
const res = loadCase(dir);
if (res.ok) console.log(`✓ ${dir}: case files valid, references ok`);
else {
  failed = true;
  console.log(`✗ ${dir}`);
  res.errors.slice(0, 10).forEach((e) => console.log('  ' + e));
  if (res.errors.length > 10) console.log(`  … ${res.errors.length - 10} more`);
}
const configs: [string, () => unknown][] = [
  ['config/profiles/family.yaml', () => loadProfile('config/profiles/family.yaml')],
  ['config/profiles/friends.yaml', () => loadProfile('config/profiles/friends.yaml')],
  ['config/scoring.json', () => loadScoring('config/scoring.json')],
  ['config/quality.json', () => loadQuality('config/quality.json')],
];
for (const [name, fn] of configs) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed = true;
    console.log(`✗ ${name}\n  ${(e as Error).message}`);
  }
}
process.exit(failed ? 1 : 0);
