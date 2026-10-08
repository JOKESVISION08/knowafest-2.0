import { fetchKnowaFestEvents } from '../../src/services/knowafestService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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
    console.error('Vercel live-events error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error fetching events',
      events: [],
    });
  }
}
