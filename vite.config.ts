import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const disableHmr = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/');

            if (!normalizedId.includes('node_modules')) return;

            if (
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (normalizedId.includes('/@supabase/')) {
              return 'supabase-vendor';
            }

            if (normalizedId.includes('/recharts/')) {
              return 'charts-vendor';
            }

            if (normalizedId.includes('/motion/') || normalizedId.includes('/framer-motion/')) {
              return 'motion-vendor';
            }

            if (normalizedId.includes('/date-fns/')) {
              return 'date-vendor';
            }

            if (normalizedId.includes('/react-day-picker/')) {
              return 'calendar-vendor';
            }

            if (normalizedId.includes('/lucide-react/')) {
              return 'icons-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      // In local dev the browser opens the app at http://localhost:3000.
      // Pin the HMR websocket to that same endpoint so live reload works
      // without changing remote Supabase requests or the existing proxy.
      hmr: disableHmr
        ? false
        : {
            protocol: 'ws',
            host: 'localhost',
            port: 3000,
            clientPort: 3000,
          },
      proxy: supabaseUrl
        ? {
            '/api/admin-ops': {
              target: supabaseUrl,
              changeOrigin: true,
              secure: true,
              rewrite: () => '/functions/v1/admin-ops',
            },
          }
        : undefined,
    },
  };
});
