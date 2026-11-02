import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH is set by the Pages workflow (e.g. /adventskrimi/).
// The API lives at <supabase url>/functions/v1. Locally the root .env (staging) is the fallback.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  const url =
    process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_STAGING_URL || '';
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_STAGING_ANON_KEY ||
    '';
  return {
    base: process.env.BASE_PATH ?? '/',
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(url ? `${url}/functions/v1` : ''),
      __ANON_KEY__: JSON.stringify(key),
    },
  };
});
