// Usage: npm run balance [-- cases/berghotel]  Runs all bots for both profiles and lists violations of docs/07 §5.
import { existsSync } from 'node:fs';
import { loadCase, loadProfile, loadQuality, loadScoring } from '../../packages/engine/src/loader';
import { balanceFindings, runBots } from '../../packages/engine/src/sim';

const dir = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'cases/berghotel';
if (!existsSync(dir)) {
  console.error(`case not found: ${dir}`);
  process.exit(2);
}
const loaded = loadCase(dir);
if (!loaded.ok) {
  loaded.errors.slice(0, 10).forEach((e) => console.error(e));
  process.exit(1);
}
const scoring = loadScoring('config/scoring.json');
const quality = loadQuality('config/quality.json');
let failed = false;
for (const id of ['friends', 'family']) {
  const profile = loadProfile(`config/profiles/${id}.yaml`);
  // the family case may be solved a bit later (docs/07 §5)
  const latest = id === 'family' ? 22 : quality.tempo.latest_day;
  const found = balanceFindings(
    runBots(loaded.data, profile, scoring, quality),
    profile,
    quality,
    latest,
  );
  console.log(`${found.length ? '✗' : '✓'} ${id}`);
  found.slice(0, 12).forEach((f) => console.log('  ' + f));
  if (found.length) failed = true;
}
process.exit(failed ? 1 : 0);
