import { Handler } from '@netlify/functions';
import { fetchKnowaFestEventDetails } from '../../src/services/knowafestService';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler: Handler = async (event) => {
  const url = event.queryStringParameters?.url || '';

  if (!url || !url.startsWith('https://www.knowafest.com')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid KnowaFest event URL' }),
    };
  }

  try {
    const details = await fetchKnowaFestEventDetails(url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, details }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message || 'Error fetching event details' }),
    };
  }
};
