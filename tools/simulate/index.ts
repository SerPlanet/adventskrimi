// Usage: npm run simulate -- cases/_test --profile friends [--bot optimal|greedy|random|newspaper_only|worst] [--seeds N] [--json]
import { loadCase, loadProfile, loadQuality, loadScoring } from '../../packages/engine/src/loader';
import { BOTS, runBots, summary, type BotName } from '../../packages/engine/src/sim';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const opt = (n: string) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const profileId = opt('--profile');
const bot = opt('--bot') as BotName | undefined;
if (!dir || !profileId || (bot && !BOTS.includes(bot))) {
  console.error(
    `usage: simulate <case-dir> --profile <p> [--bot ${BOTS.join('|')}] [--seeds N] [--json]`,
  );
  process.exit(2);
}
const loaded = loadCase(dir);
if (!loaded.ok) {
  loaded.errors.slice(0, 10).forEach((e) => console.error(e));
  process.exit(1);
}
const runs = runBots(
  loaded.data,
  loadProfile(`config/profiles/${profileId}.yaml`),
  loadScoring('config/scoring.json'),
  loadQuality('config/quality.json'),
  { bots: bot ? [bot] : undefined, seeds: opt('--seeds') ? Number(opt('--seeds')) : undefined },
);
if (args.includes('--json')) console.log(JSON.stringify(runs));
else for (const r of runs) console.log(summary(r).join('\n'));
