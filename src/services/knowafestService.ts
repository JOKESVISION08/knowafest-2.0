// Robust KnowaFest scraper and proxy service for all college technical symposiums
import * as cheerio from 'cheerio';
import { LiveSymposium, EventFullDetails } from '../types';
import { CURATED_EVENTS } from '../data/curatedEvents';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export function decodeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&bull;/g, '•')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .trim();
}

export const CITY_MAP: Record<string, { displayName: string; slug: string }> = {
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

export function resolveSearchQuery(input: string): { isCity: boolean; displayName: string; slug: string; query: string } {
  if (!input) return { isCity: false, displayName: 'All Locations', slug: '', query: '' };
  const clean = input.trim().toLowerCase();
  if (CITY_MAP[clean]) return { isCity: true, displayName: CITY_MAP[clean].displayName, slug: CITY_MAP[clean].slug, query: input.trim() };
  return { isCity: false, displayName: input.trim(), slug: '', query: input.trim() };
}

export function parseKnowaFestHtml(html: string, defaultCity: string = 'Tamil Nadu'): LiveSymposium[] {
  if (!html) return [];
  const $ = cheerio.load(html);
  const items: LiveSymposium[] = [];

  $('.event-card').each((index, el) => {
    const titleEl = $(el).find('.card-title');
    const title = decodeHtml(titleEl.text().trim());
    let rawHref = titleEl.attr('href') || $(el).find('.card-footer a').attr('href') || '';
    const college = decodeHtml($(el).find('.college').text().trim()) || 'Engineering College';
    const tag = decodeHtml($(el).find('.card-topline .tag').text().trim()) || 'Technical Symposium';
    const spans = $(el).find('.card-meta span').map((_, s) => $(s).text().trim()).get();
    const rawDate = spans[0] ? decodeHtml(spans[0].replace(/^[^\w\d]+/, '').trim()) : 'Upcoming 2026';
    const rawCity = spans[1] ? decodeHtml(spans[1].replace(/^[^\w\d]+/, '').trim()) : defaultCity;
    const fee = decodeHtml($(el).find('.card-footer strong').text().trim()) || 'Free entry';

    let knowafestUrl = 'https://www.knowafest.com/events';
    if (rawHref) {
      if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
        knowafestUrl = rawHref;
      } else {
        knowafestUrl = `https://www.knowafest.com${rawHref.startsWith('/') ? '' : '/'}${rawHref}`;
      }
    }

    if (title && title.length > 2 && knowafestUrl.includes('/event/')) {
      const slug = knowafestUrl.replace('https://www.knowafest.com/event/', '').replace(/[^a-zA-Z0-9-]/g, '');
      const tLower = (title + ' ' + tag).toLowerCase();
      let category = 'Symposiums';
      if (tLower.includes('hack')) category = 'Hackathons';
      else if (tLower.includes('work') || tLower.includes('bootcamp')) category = 'Workshops';
      else if (tLower.includes('conference')) category = 'Conferences';

      items.push({
        id: `kf-${slug || index}`,
        title,
        college,
        city: rawCity,
        date: rawDate,
        category,
        knowafestUrl,
        fee,
        about: `Official ${tag} organized by ${college}, ${rawCity}. Features competitions, workshops, and exhibitions. Click View Details to jump to the official event page.`,
      });
    }
  });

  return items;
}

export function parseKnowaFestRss(xml: string): LiveSymposium[] {
  if (!xml) return [];
  const items: LiveSymposium[] = [];
  try {
    const rawItems = xml.split('<item>').slice(1);
    rawItems.forEach((raw, idx) => {
      const titleMatch = raw.match(/<title>(.*?)<\/title>/);
      const linkMatch = raw.match(/<link>(.*?)<\/link>/);
      const desc = decodeHtml(raw.match(/<description>(.*?)<\/description>/)?.[1] ?? '');
      
      if (titleMatch) {
        let rawHref = linkMatch ? linkMatch[1] : '';
        let knowafestUrl = 'https://www.knowafest.com/events';
        if (rawHref) {
          if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
            knowafestUrl = rawHref;
          } else {
            knowafestUrl = `https://www.knowafest.com${rawHref.startsWith('/') ? '' : '/'}${rawHref}`;
          }
        }

        items.push({
          id: `kf-rss-${idx}`,
          title: decodeHtml(titleMatch[1]),
          college: 'Engineering College',
          city: 'Tamil Nadu',
          date: 'Upcoming',
          category: 'Technical Symposium',
          knowafestUrl,
          about: desc.slice(0, 200),
        });
      }
    });
  } catch (err) { console.warn('RSS parse fail', err); }
  return items;
}

export async function fetchKnowaFestEvents(
  location: string = '',
  stream: string = '',
  month: string = 'all'
): Promise<{ events: LiveSymposium[]; targetUrl: string; totalFound: number; city: string }> {
  let events = [...CURATED_EVENTS];
  try {
    const endpoints = [
      'https://www.knowafest.com/categories/symposiums',
      'https://www.knowafest.com/events',
      'https://www.knowafest.com/events/page/2'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const html = await res.text();
          const scraped = parseKnowaFestHtml(html);
          if (scraped.length > 0) {
            const map = new Map();
            events.forEach(e => map.set(e.knowafestUrl || e.title.toLowerCase().trim(), e));
            scraped.forEach(e => map.set(e.knowafestUrl || e.title.toLowerCase().trim(), e));
            events = Array.from(map.values());
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
  } catch (err) { console.warn('Scraping notice:', err); }

  const loc = location.trim().toLowerCase();
  const st = stream.trim().toLowerCase();
  const mo = month.trim().toLowerCase();

  const isAllLoc = !loc || loc === 'all' || loc === 'all locations' || loc === 'all colleges';

  const filtered = events.filter(e => {
    // Check location across city, college, title, about
    const locText = `${e.city || ''} ${e.college || ''} ${e.title || ''} ${e.about || ''}`.toLowerCase();
    const matchesLoc = isAllLoc || locText.includes(loc);

    // Check stream across department, title, category
    const streamText = `${e.department || ''} ${e.title || ''} ${e.category || ''}`.toLowerCase();
    const matchesStream = !st || streamText.includes(st);

    // Check month across date
    const dateText = (e.date || '').toLowerCase();
    const matchesMonth = mo === 'all' || dateText.includes(mo);

    return matchesLoc && matchesStream && matchesMonth;
  });

  return {
    events: filtered,
    targetUrl: 'https://www.knowafest.com/categories/symposiums',
    totalFound: filtered.length,
    city: location || 'All Locations'
  };
}

export async function fetchKnowaFestEventDetails(rawUrl: string): Promise<EventFullDetails> {
  const existing = CURATED_EVENTS.find(e => e.knowafestUrl === rawUrl || (e.id && rawUrl.includes(e.id)));
  
  if (rawUrl && rawUrl.startsWith('https://www.knowafest.com')) {
    try {
      const res = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);

        const title = decodeHtml($('h1').first().text().trim());
        let regLink = '';
        $('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          const txt = $(a).text().toLowerCase();
          if ((txt.includes('register') || txt.includes('website') || href.includes('forms.gle') || href.includes('google.com/forms') || href.includes('unstop')) && !regLink && !href.startsWith('#')) {
            regLink = href;
          }
        });

        const about = decodeHtml($('.event-description, main p, article p, .content p').first().text().trim());

        return {
          url: rawUrl,
          title: title || existing?.title || 'Technical Symposium Details',
          about: about || existing?.about || 'Annual collegiate technical symposium featuring paper presentations, workshops, and competitions.',
          registrationUrl: regLink || rawUrl,
          when: existing?.date,
          where: existing?.college,
          department: existing?.department,
          fee: existing?.fee,
        };
      }
    } catch (err) {
      console.warn('Real-time details fetch notice:', err);
    }
  }

  return {
    url: rawUrl,
    title: existing?.title || 'Technical Symposium Details',
    about: existing?.about || 'Annual collegiate technical symposium featuring paper presentations, workshops, and competitions.',
    registrationUrl: existing?.registrationUrl || rawUrl,
    when: existing?.date,
    where: existing?.college,
    department: existing?.department,
    fee: existing?.fee,
  };
}

export async function proxyKnowaFestPortal(rawUrl: string, loc: string): Promise<string> {
  const target = rawUrl || (loc ? `https://www.knowafest.com/cities/${encodeURIComponent(loc.toLowerCase())}` : 'https://www.knowafest.com/events');
  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    // Fallback
  }
  return '<html><body><p>Portal unavailable</p></body></html>';
}
