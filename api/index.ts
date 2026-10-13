import {
  fetchKnowaFestEvents,
  fetchKnowaFestEventDetails,
  proxyKnowaFestPortal,
} from '../src/services/knowafestService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';

  try {
    if (url.includes('/api/knowafest/event-details')) {
      const targetUrl = (req.query?.url as string) || '';
      const details = await fetchKnowaFestEventDetails(targetUrl);
      return res.status(200).json({ success: true, details });
    }

    if (url.includes('/api/knowafest/portal')) {
      const rawUrl = (req.query?.url as string) || '';
      const loc = (req.query?.location as string) || '';
      const html = await proxyKnowaFestPortal(rawUrl, loc);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    const location = (req.query?.location as string) || (req.query?.search as string) || '';
    const stream = (req.query?.stream as string) || '';
    const result = await fetchKnowaFestEvents(location, stream);

    return res.status(200).json({
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
  } catch (err: any) {
    console.error('API dispatcher error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
}
