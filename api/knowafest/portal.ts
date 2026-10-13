import { proxyKnowaFestPortal } from '../../src/services/knowafestService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const rawUrl = (req.query?.url as string) || '';
    const loc = (req.query?.location as string) || '';

    const html = await proxyKnowaFestPortal(rawUrl, loc);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader?.('X-Frame-Options');
    res.removeHeader?.('Content-Security-Policy');
    return res.status(200).send(html);
  } catch (err: any) {
    console.error('Vercel portal error:', err);
    return res.status(500).send(`Error loading KnowaFest portal: ${err.message}`);
  }
}
