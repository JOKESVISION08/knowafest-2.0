import { fetchKnowaFestEventDetails } from '../../src/services/knowafestService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = (req.query?.url as string) || '';
    if (!rawUrl || !rawUrl.startsWith('https://www.knowafest.com')) {
      return res.status(400).json({ success: false, error: 'Invalid KnowaFest event URL' });
    }

    const details = await fetchKnowaFestEventDetails(rawUrl);
    return res.status(200).json({ success: true, details });
  } catch (err: any) {
    console.error('Vercel event-details error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error fetching event details' });
  }
}
