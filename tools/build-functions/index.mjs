// Bundles the engine API (pure TypeScript + zod) into one file the edge functions import.
// Output is generated and git-ignored: run before deploying or running integration tests.
import { build } from 'esbuild';

await build({
  entryPoints: ['packages/engine/src/api/index.ts'],
  outfile: 'supabase/functions/_shared/engine.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  logLevel: 'warning',
});
console.log('built supabase/functions/_shared/engine.js');
