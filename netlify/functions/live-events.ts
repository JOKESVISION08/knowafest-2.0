import { Handler } from '@netlify/functions';
import { fetchKnowaFestEvents } from '../../src/services/knowafestService';
import { CURATED_EVENTS } from '../../src/data/curatedEvents';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler: Handler = async (event) => {
  const location =
    event.queryStringParameters?.location ||
    event.queryStringParameters?.search ||
    event.queryStringParameters?.college ||
    '';
  const stream = event.queryStringParameters?.stream || '';
  const month = event.queryStringParameters?.month || 'all';

  try {
    const result = await fetchKnowaFestEvents(location, stream, month);
    const eventsToReturn = result.events && result.events.length > 0 ? result.events : CURATED_EVENTS;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        location: result.city || 'All Locations',
        url: result.targetUrl,
        count: eventsToReturn.length,
        events: eventsToReturn,
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        location: 'All Locations',
        url: 'https://www.knowafest.com/categories/symposiums',
        count: CURATED_EVENTS.length,
        events: CURATED_EVENTS,
      }),
    };
  }
};
