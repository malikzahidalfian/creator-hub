import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Run the same Vercel handlers locally; /api must not fall through to index.html.
function localApi() {
  return {
    name: 'creator-hub-local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const name = req.url.split('?')[0].replace(/^\//, '');
        const routes = ['auth', 'database', 'generate', 'generate-image', 'scrape-article', 'scrape-tiktok', 'tts'];
        res.status = code => { res.statusCode = code; return res; };
        res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); return res; };
        res.send = value => { res.end(value); return res; };
        if (!routes.includes(name)) return res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
        try {
          const chunks = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 4_000_000) return res.status(413).json({ error: 'Payload terlalu besar.' });
            chunks.push(chunk);
          }
          const text = Buffer.concat(chunks).toString();
          try { req.body = text ? JSON.parse(text) : {}; } catch { return res.status(400).json({ error: 'JSON tidak valid.' }); }
          const handler = await server.ssrLoadModule(`/api/${name}.js`);
          await handler.default(req, res);
        } catch (error) {
          console.error(error);
          if (!res.writableEnded) res.status(500).json({ error: 'Terjadi kesalahan pada server lokal.' });
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), localApi()],
    server: {
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.private/**'] },
      watch: { ignored: ['**/.private/**'] }
    }
  };
});
