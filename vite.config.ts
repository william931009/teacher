import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Vital: Map the VITE_API_KEY (from Vercel) to process.env.API_KEY (required by GenAI SDK)
      // This allows us to use `process.env.API_KEY` in the code while keeping Vercel settings standard.
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});