// Usage: npm run validate-case -- cases/_test --profile friends [--only <check>]
// Optional per-case overrides of config/quality.json: <case>/quality.override.json (shallow merge per key).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadCase, loadProfile, loadQuality } from '../../packages/engine/src/loader';
import { CHECK_NAMES, runChecks, type CheckName } from '../../packages/engine/src/validate';
import { Quality } from '../../packages/engine/src/schemas';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const profileId = opt('--profile');
const only = opt('--only') as CheckName | undefined;
if (!dir || !profileId || (only && !CHECK_NAMES.includes(only))) {
  console.error(
    `usage: validate-case <case-dir> --profile <family|friends> [--only ${CHECK_NAMES.join('|')}]`,
  );
  process.exit(2);
}

const loaded = loadCase(dir);
if (!loaded.ok) {
  console.log('✗ schema');
  loaded.errors.slice(0, 10).forEach((e) => console.log('  ' + e));
  process.exit(1);
}
const profile = loadProfile(`config/profiles/${profileId}.yaml`);
let quality = loadQuality('config/quality.json');
const overridePath = join(dir, 'quality.override.json');
if (existsSync(overridePath)) {
  quality = Quality.parse({ ...quality, ...JSON.parse(readFileSync(overridePath, 'utf8')) });
  console.log('· using quality.override.json');
}

if (!only) console.log('✓ schema');
let failed = false;
for (const r of runChecks(loaded.data, profile, quality, only)) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.note ? ` (${r.note})` : ''}`);
  r.errors.slice(0, 10).forEach((e) => console.log('  ' + e));
  if (r.errors.length > 10) console.log(`  … ${r.errors.length - 10} more`);
  if (!r.ok) failed = true;
}
process.exit(failed ? 1 : 0);
