import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const SN_TARGET = env.VITE_SN_INSTANCE || 'https://nextgenbpmnp1.service-now.com';

  const clientId = env.VITE_SN_OAUTH_CLIENT_ID || '';
  const clientSecret = env.VITE_SN_OAUTH_CLIENT_SECRET || '';
  const useOAuth = Boolean(clientId && clientSecret);

  console.log('[Vite Config] Target:', SN_TARGET);
  console.log('[Vite Config] OAuth Mode:', useOAuth);

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {

        // ── OAuth token exchange ─────────────────────────────────────────
        // Rewrites /servicenow-oauth → /oauth_token.do on the SN instance
        '/servicenow-oauth': {
          target: SN_TARGET,
          changeOrigin: true,
          secure: true,
          rewrite: () => '/oauth_token.do',
          selfHandleResponse: false,

          configure(proxy) {
            proxy.on('proxyRes', (proxyRes) => {
              console.log('[OAuth Proxy] Status:', proxyRes.statusCode);
            });
            proxy.on('error', (err) => {
              console.error('[OAuth Proxy] Error:', err.message);
            });
          },
        },

        // ── ServiceNow Table / REST API calls ────────────────────────────
        // Strips /servicenow-api prefix before forwarding to SN instance
        '/servicenow-api': {
          target: SN_TARGET,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/servicenow-api/, ''),

          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[API Proxy]', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes) => {
              console.log('[API Proxy] Status:', proxyRes.statusCode);
              // Prevent browser auth popup on 401
              if (proxyRes.statusCode === 401) {
                delete proxyRes.headers['www-authenticate'];
              }
            });
            proxy.on('error', (err) => {
              console.error('[API Proxy] Error:', err.message);
            });
          },
        },

      },
    },
  };
});
