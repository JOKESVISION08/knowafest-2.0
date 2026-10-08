import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchKnowaFestEvents,
  fetchKnowaFestEventDetails,
  proxyKnowaFestPortal,
} from './src/services/knowafestService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// 1. Live Embedded Portal Gateway
app.get('/api/knowafest/portal', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    const loc = (req.query.location as string) || '';
    const html = await proxyKnowaFestPortal(rawUrl, loc);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.send(html);
  } catch (err: any) {
    console.error('Portal proxy error:', err);
    res.status(500).send(`Error loading KnowaFest portal: ${err.message}`);
  }
});

// 2. Real-time Live Events Endpoint
app.get('/api/knowafest/live-events', async (req, res) => {
  const location = (req.query.location as string) || (req.query.search as string) || '';
  const stream = (req.query.stream as string) || '';

  const result = await fetchKnowaFestEvents(location, stream);

  res.json({
    success: true,
    location: result.city,
    url: result.targetUrl,
    count: result.events.length,
    events: result.events,
    message:
      result.events.length > 0
        ? `Loaded ${result.events.length} live technical symposiums in ${result.city} from KnowaFest.com`
        : `No upcoming events found for "${result.city}" on KnowaFest.com`,
  });
});

// 3. Full Event Details Endpoint
app.get('/api/knowafest/event-details', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl || !rawUrl.startsWith('https://www.knowafest.com')) {
      return res.status(400).json({ success: false, error: 'Invalid KnowaFest event URL' });
    }

    const details = await fetchKnowaFestEventDetails(rawUrl);
    res.json({ success: true, details });
  } catch (err: any) {
    console.error('Error in event-details endpoint:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`KnowaFest Live Portal Server running on http://0.0.0.0:${port}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
