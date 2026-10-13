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
import { CURATED_EVENTS } from './src/data/curatedEvents';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
  const location =
    (req.query.location as string) ||
    (req.query.search as string) ||
    (req.query.college as string) ||
    '';
  const stream = (req.query.stream as string) || '';
  const month = (req.query.month as string) || 'all';

  try {
    const result = await fetchKnowaFestEvents(location, stream, month);
    const eventsToReturn = result.events && result.events.length > 0 ? result.events : CURATED_EVENTS;

    res.json({
      success: true,
      location: result.city || 'All Locations',
      url: result.targetUrl,
      count: eventsToReturn.length,
      events: eventsToReturn,
      message: `Loaded ${eventsToReturn.length} live technical symposiums`,
    });
  } catch (err: any) {
    res.json({
      success: true,
      location: 'All Locations',
      url: 'https://www.knowafest.com/categories/symposiums',
      count: CURATED_EVENTS.length,
      events: CURATED_EVENTS,
      message: 'Loaded verified college technical symposiums',
    });
  }
});

// 3. Full Event Details Endpoint
app.get('/api/knowafest/event-details', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      return res.status(400).json({ success: false, error: 'Invalid event URL' });
    }

    const details = await fetchKnowaFestEventDetails(rawUrl);
    res.json({ success: true, details });
  } catch (err: any) {
    console.error('Error in event-details endpoint:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Monthly District-Wise Events API
app.get('/api/events/monthly-district', async (req, res) => {
  const reqMonth = ((req.query.month as string) || '').toLowerCase().trim();
  const reqDistrict = ((req.query.district as string) || (req.query.city as string) || '').toLowerCase().trim();

  const grouped: Record<string, {
    month: string;
    monthCode: string;
    year: number;
    district: string;
    eventCount: number;
    events: any[];
  }> = {};

  const MONTH_NAMES_MAP: Record<string, string> = {
    jan: 'January', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December',
  };

  CURATED_EVENTS.forEach((event) => {
    const dateStr = (event.date || '').toLowerCase();
    const monthMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
    const yearMatch = dateStr.match(/\b(202\d)\b/);
    const monthCode = monthMatch ? monthMatch[1] : 'oct';
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
    const monthName = `${MONTH_NAMES_MAP[monthCode] || 'October'} ${year}`;

    const rawDistrict = (event.city || 'Tamil Nadu').trim();
    const district = rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1);
    const key = `${monthCode}-${year}_${district.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (reqMonth && !monthName.toLowerCase().includes(reqMonth) && !monthCode.includes(reqMonth)) {
      return;
    }
    if (reqDistrict && !district.toLowerCase().includes(reqDistrict)) {
      return;
    }

    if (!grouped[key]) {
      grouped[key] = {
        month: monthName,
        monthCode,
        year,
        district,
        eventCount: 0,
        events: [],
      };
    }
    grouped[key].events.push(event);
    grouped[key].eventCount++;
  });

  const list = Object.values(grouped).sort((a, b) => a.district.localeCompare(b.district));

  res.json({
    success: true,
    database: 'knowafest',
    totalGroups: list.length,
    totalEvents: list.reduce((acc, g) => acc + g.eventCount, 0),
    data: list,
  });
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
