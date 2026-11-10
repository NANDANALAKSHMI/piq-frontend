import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Serves the Vercel functions in /api during `npm run dev`, so team invitations can be tested
 * locally. On Vercel the same files run as serverless functions. Server-only keys (SMTP_PASS…)
 * are read from .env.local here and never reach the browser — only VITE_* keys are bundled.
 */
function vercelApiInDev() {
  return {
    name: 'box-theory:api-dev',
    apply: 'serve',
    configureServer(server) {
      const fileEnv = loadEnv(server.config.mode, server.config.envDir || server.config.root, '');
      for (const [key, value] of Object.entries(fileEnv)) process.env[key] ??= value;

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const route = /^\/api\/([\w-]+)\/?$/.exec(url.pathname)?.[1];
        if (!route) return next();

        const sendJson = (status, payload) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
        };

        let handler;
        try {
          ({ default: handler } = await server.ssrLoadModule(`/api/${route}.js`));
        } catch (error) {
          const message = String(error?.message ?? error);
          const missingPackage = /Cannot find (package|module)|Failed to resolve import/i.test(message);
          server.config.logger.error(`[api] ${message}`);
          return sendJson(missingPackage ? 500 : 404, {
            ok: false,
            error: missingPackage ? 'API packages are missing — run npm install, then restart npm run dev.' : `No API route /api/${route}.`,
          });
        }

        // Give the handler the same helpers Vercel provides (req.body, req.query, res.status().json()).
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          req.body = raw && (req.headers['content-type'] ?? '').includes('application/json') ? JSON.parse(raw) : raw;
        } catch {
          req.body = raw;
        }
        req.query = Object.fromEntries(url.searchParams);
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (payload) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(payload));
          return res;
        };
        res.send = (payload) => {
          res.end(typeof payload === 'string' || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload));
          return res;
        };

        try {
          await handler(req, res);
        } catch (error) {
          server.config.logger.error(`[api] /api/${route} crashed: ${error?.stack ?? error}`);
          if (!res.writableEnded) sendJson(500, { ok: false, error: 'The API route crashed — see the npm run dev terminal.' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiInDev()],
});
