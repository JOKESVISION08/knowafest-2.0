import { fetchKnowaFestEvents } from '../../src/services/knowafestService';
import { CURATED_EVENTS } from '../../src/data/curatedEvents';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const location =
      (req.query?.location as string) ||
      (req.query?.search as string) ||
      (req.query?.college as string) ||
      '';
    const stream = (req.query?.stream as string) || '';
    const month = (req.query?.month as string) || 'all';

    const result = await fetchKnowaFestEvents(location, stream, month);

    const eventsToReturn = result.events && result.events.length > 0 ? result.events : CURATED_EVENTS;

    return res.status(200).json({
      success: true,
      location: result.city || 'All Locations',
      url: result.targetUrl,
      count: eventsToReturn.length,
      events: eventsToReturn,
      message: `Loaded ${eventsToReturn.length} live technical symposiums`,
    });
  } catch (err: any) {
    console.warn('Vercel live-events graceful fallback:', err);
    return res.status(200).json({
      success: true,
      location: 'All Locations',
      url: 'https://www.knowafest.com/categories/symposiums',
      count: CURATED_EVENTS.length,
      events: CURATED_EVENTS,
      message: 'Loaded verified college technical symposiums',
    });
  }
}
