import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function getCitySlug(input: string): { displayName: string; slug: string } {
  if (!input) return { displayName: 'All Locations', slug: '' };
  const clean = input.trim().toLowerCase();

  const cityMap: Record<string, { displayName: string; slug: string }> = {
    coimbatore: { displayName: 'Coimbatore', slug: 'coimbatore' },
    chennai: { displayName: 'Chennai', slug: 'chennai' },
    bengaluru: { displayName: 'Bengaluru', slug: 'bengaluru' },
    hyderabad: { displayName: 'Hyderabad', slug: 'hyderabad' },
    madurai: { displayName: 'Madurai', slug: 'madurai' },
    trichy: { displayName: 'Tiruchirappalli', slug: 'tiruchirappalli' },
    salem: { displayName: 'Salem', slug: 'salem' },
    vellore: { displayName: 'Vellore', slug: 'vellore' },
    erode: { displayName: 'Erode', slug: 'erode' },
  };

  if (cityMap[clean]) return cityMap[clean];
  const slug = clean.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const displayName = clean
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { displayName, slug };
}

app.get(['/live-events', '/api/knowafest/live-events'], async (req, res) => {
  const location =
    (req.query.location as string) ||
    (req.query.search as string) ||
    (req.query.college as string) ||
    '';
  const month = (req.query.month as string) || 'all';
  const { displayName, slug } = getCitySlug(location);

  const targetUrl = slug
    ? `https://www.knowafest.com/cities/${encodeURIComponent(slug)}`
    : 'https://www.knowafest.com/events';

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);
    const events: any[] = [];

    $('article.event-card').each((index, el) => {
      const titleEl = $(el).find('a.card-title').first();
      const title = decodeHtml(titleEl.text().trim());
      let href = titleEl.attr('href') || '';
      if (href && !href.startsWith('http')) {
        href = `https://www.knowafest.com${href.startsWith('/') ? '' : '/'}${href}`;
      }

      const college = decodeHtml($(el).find('a.college').first().text().trim()) || 'Engineering College';
      const tag = decodeHtml($(el).find('.card-topline .tag').first().text().trim()) || 'Technical Symposium';

      const metaSpans = $(el)
        .find('.card-meta span')
        .map((_, s) => $(s).text().trim())
        .get();

      const rawDate = metaSpans[0] ? metaSpans[0].replace(/^[^\w\d]+/, '').trim() : 'Upcoming 2026';
      const rawCity = metaSpans[1] ? metaSpans[1].replace(/^[^\w\d]+/, '').trim() : displayName || 'Tamil Nadu';
      const feeText = $(el).find('.card-footer strong').first().text().trim();

      if (title && title.length > 2) {
        events.push({
          id: `kf-card-${index + 1}-${title.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
          title,
          college,
          city: decodeHtml(rawCity),
          date: decodeHtml(rawDate),
          category: tag,
          knowafestUrl: href || 'https://www.knowafest.com/events',
          fee: feeText || undefined,
        });
      }
    });

    res.json({
      success: true,
      location: displayName,
      url: targetUrl,
      count: events.length,
      events,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, events: [] });
  }
});

app.get(['/event-details', '/api/knowafest/event-details'], async (req, res) => {
  const rawUrl = (req.query.url as string) || '';
  if (!rawUrl || !rawUrl.startsWith('https://www.knowafest.com')) {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = decodeHtml($('h1, .hero h1, title').first().text().trim());
    const regLink = $('a[data-event-link="registration"]').first().attr('href') || '';
    const about = decodeHtml($('h2:contains("About") + .event-rich-content').first().text().trim());
    const when = $('dt:contains("When") + dd').first().text().trim().replace(/\s+/g, ' ');
    const where = $('dt:contains("Where") + dd').first().text().trim().replace(/\s+/g, ' ');
    const dept = $('dt:contains("department") + dd').first().text().trim();
    const fee = $('h2:contains("Fees") + .event-rich-content').first().text().trim();

    return res.json({
      success: true,
      details: {
        url: rawUrl,
        title,
        about: about || 'College symposium with workshops, competitions, and paper presentations.',
        registrationUrl: regLink || rawUrl,
        when: when || undefined,
        where: where || undefined,
        department: dept || undefined,
        fee: fee || undefined,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export const api = functions.https.onRequest(app);
