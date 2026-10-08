// Shared KnowaFest scraper and proxy service for both local dev and Vercel serverless

export interface LiveSymposium {
  id: string;
  title: string;
  college: string;
  city: string;
  date: string;
  category: string;
  knowafestUrl: string;
  description?: string;
}

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

export function normalizeCity(input: string): string {
  if (!input) return '';
  const clean = input.trim().toLowerCase();

  if (clean === 'coimbatore' || clean === 'kovai') return 'Coimbatore';
  if (clean === 'chennai' || clean === 'madras') return 'Chennai';
  if (clean === 'bengaluru' || clean === 'bangalore') return 'Bengaluru';
  if (clean === 'hyderabad' || clean === 'hyd') return 'Hyderabad';
  if (clean === 'madurai') return 'Madurai';
  if (clean === 'trichy' || clean === 'tiruchirappalli' || clean === 'tiruchirapalli') return 'Tiruchirappalli';
  if (clean === 'salem') return 'Salem';
  if (clean === 'vellore') return 'Vellore';
  if (clean === 'erode') return 'Erode';
  if (clean === 'namakkal') return 'Namakkal';
  if (clean === 'tirunelveli' || clean === 'nellai') return 'Tirunelveli';
  if (clean === 'thanjavur' || clean === 'tanjore') return 'Thanjavur';
  if (clean === 'tiruppur' || clean === 'tirupur') return 'Tiruppur';
  if (clean === 'pollachi') return 'Pollachi';
  if (clean === 'pune') return 'Pune';
  if (clean === 'mumbai' || clean === 'bombay') return 'Mumbai';
  if (clean === 'delhi' || clean === 'delhi ncr' || clean === 'new delhi') return 'Delhi';
  if (clean === 'kochi' || clean === 'cochin') return 'Kochi';
  if (clean === 'trivandrum' || clean === 'thiruvananthapuram') return 'Thiruvananthapuram';
  if (clean === 'ahmedabad') return 'Ahmedabad';
  if (clean === 'jaipur') return 'Jaipur';
  if (clean === 'kolkata' || clean === 'calcutta') return 'Kolkata';
  if (clean === 'vijayamangalam') return 'Vijayamangalam';
  if (clean === 'dindigul') return 'Dindigul';
  if (clean === 'karur') return 'Karur';
  if (clean === 'kanchipuram') return 'Kanchipuram';

  return clean
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

const liveCache = new Map<string, { timestamp: number; events: LiveSymposium[]; targetUrl: string; totalFound: number }>();
const eventDetailCache = new Map<string, { timestamp: number; details: any }>();

export async function fetchKnowaFestEvents(
  locationQuery: string = '',
  streamKeyword: string = ''
): Promise<{ events: LiveSymposium[]; targetUrl: string; totalFound: number; city: string }> {
  const normCity = normalizeCity(locationQuery);
  const cacheKey = `${normCity.toLowerCase()}__${streamKeyword.toLowerCase()}`;
  const now = Date.now();
  const cached = liveCache.get(cacheKey);

  if (cached && now - cached.timestamp < 60000) {
    return {
      events: cached.events,
      targetUrl: cached.targetUrl,
      totalFound: cached.totalFound,
      city: normCity || 'All Locations',
    };
  }

  const events: LiveSymposium[] = [];
  let targetUrl = 'https://www.knowafest.com/explore/events';

  try {
    if (normCity && normCity !== 'All' && normCity !== 'All Locations' && normCity !== 'All Cities') {
      const cityUrl = `https://www.knowafest.com/explore/city/${encodeURIComponent(normCity)}`;
      targetUrl = cityUrl;

      const res = await fetch(cityUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (res.ok) {
        const html = await res.text();
        const trRegex =
          /<tr\s+itemscope\s+itemtype="http:\/\/schema\.org\/Event"\s+onClick="window\.open\(([^)]+)\);\s*"\s*>([\s\S]*?)<\/tr>/gi;
        let match: RegExpExecArray | null;
        let count = 0;

        while ((match = trRegex.exec(html)) !== null) {
          count++;
          const rawUrl = match[1].replace(/['"]/g, '').trim();
          const rowContent = match[2];

          const dateMatch = /itemprop="startDate">([^<]+)<\/td>/.exec(rowContent);
          const nameMatch = /itemprop="name">\s*([^<]+)\s*<\/td>/.exec(rowContent);
          const catMatch = /<td class="optout">([^<]+)<\/td>/.exec(rowContent);
          const collegeMatch = /itemprop="name">([^<]+)<\/span>/.exec(rowContent);
          const locMatch = /itemprop="addressLocality">([^<]+)<\/span>/.exec(rowContent);

          const title = decodeHtml(nameMatch ? nameMatch[1] : 'Technical Event');
          const date = decodeHtml(dateMatch ? dateMatch[1] : 'Upcoming 2026');
          const category = decodeHtml(catMatch ? catMatch[1] : 'Technical Symposium');
          const college = decodeHtml(
            collegeMatch ? collegeMatch[1].replace(/,\s*$/, '') : 'Engineering College'
          );
          const city = decodeHtml(
            locMatch ? locMatch[1].replace(/,\s*$/, '') : normCity
          );

          let fullEventUrl = rawUrl;
          if (!fullEventUrl.startsWith('http')) {
            const cleanPath = fullEventUrl.replace(/^\.\.\//, '').replace(/^\/+/, '');
            fullEventUrl = `https://www.knowafest.com/explore/${cleanPath}`;
          }

          events.push({
            id: `kf-city-${normCity.toLowerCase()}-${count}`,
            title,
            college,
            city,
            date,
            category,
            knowafestUrl: fullEventUrl,
          });
        }
      }
    }

    if (events.length === 0) {
      const exploreUrl = 'https://www.knowafest.com/explore/events';
      if (!normCity || normCity === 'All Locations') {
        targetUrl = exploreUrl;
      }

      const res = await fetch(exploreUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (res.ok) {
        const html = await res.text();
        const cardRegex =
          /<h4 class="card-title">\s*<a class="text-dark" href="([^"]+)">([^<]+)<\/a>\s*<\/h4>\s*<p class="card-text">([^<]+)<\/p>/gi;
        let match: RegExpExecArray | null;
        let count = 0;

        const exploreEvents: LiveSymposium[] = [];

        while ((match = cardRegex.exec(html)) !== null) {
          count++;
          const href = match[1].trim();
          const title = decodeHtml(match[2]);
          const college = decodeHtml(match[3]);

          let fullUrl = href;
          if (!fullUrl.startsWith('http')) {
            fullUrl = `https://www.knowafest.com/explore/${href.replace(/^\/+/, '')}`;
          }

          let city = 'All Locations';
          const combined = (href + ' ' + college + ' ' + title).toLowerCase();
          if (combined.includes('coimbatore') || combined.includes('kovai')) city = 'Coimbatore';
          else if (combined.includes('chennai') || combined.includes('madras')) city = 'Chennai';
          else if (combined.includes('bengaluru') || combined.includes('bangalore')) city = 'Bengaluru';
          else if (combined.includes('hyderabad')) city = 'Hyderabad';
          else if (combined.includes('madurai')) city = 'Madurai';
          else if (combined.includes('trichy') || combined.includes('tiruchirappalli')) city = 'Tiruchirappalli';
          else if (combined.includes('salem')) city = 'Salem';
          else if (combined.includes('vellore')) city = 'Vellore';
          else if (combined.includes('erode')) city = 'Erode';
          else if (combined.includes('vijayamangalam')) city = 'Vijayamangalam';
          else if (combined.includes('pune')) city = 'Pune';
          else if (combined.includes('mumbai')) city = 'Mumbai';
          else if (combined.includes('delhi')) city = 'Delhi';

          exploreEvents.push({
            id: `kf-explore-${count}`,
            title,
            college,
            city,
            date: 'October 2026',
            category: title.toLowerCase().includes('hack') ? 'Hackathon' : 'Technical Symposium',
            knowafestUrl: fullUrl,
          });
        }

        if (normCity && normCity !== 'All' && normCity !== 'All Locations') {
          const searchLower = normCity.toLowerCase();
          const matched = exploreEvents.filter((ev) => {
            const combined = (ev.title + ' ' + ev.college + ' ' + ev.city + ' ' + ev.knowafestUrl).toLowerCase();
            return combined.includes(searchLower);
          });
          if (matched.length > 0) {
            events.push(...matched);
          }
        } else {
          events.push(...exploreEvents);
        }
      }
    }

    if (streamKeyword) {
      const sk = streamKeyword.toLowerCase();
      const filteredEvents = events.filter((ev) => {
        const full = (ev.title + ' ' + ev.category + ' ' + ev.college).toLowerCase();
        return full.includes(sk);
      });
      if (filteredEvents.length > 0) {
        events.length = 0;
        events.push(...filteredEvents);
      }
    }

    liveCache.set(cacheKey, {
      timestamp: now,
      events,
      targetUrl,
      totalFound: events.length,
    });

    return {
      events,
      targetUrl,
      totalFound: events.length,
      city: normCity || 'All Locations',
    };
  } catch (err: any) {
    console.error('Error fetching live KnowaFest events:', err.message);
    if (cached) {
      return {
        events: cached.events,
        targetUrl: cached.targetUrl,
        totalFound: cached.totalFound,
        city: normCity || 'All Locations',
      };
    }
    return {
      events: [],
      targetUrl,
      totalFound: 0,
      city: normCity || 'All Locations',
    };
  }
}

export async function fetchKnowaFestEventDetails(rawUrl: string) {
  if (!rawUrl || !rawUrl.startsWith('https://www.knowafest.com')) {
    throw new Error('Invalid KnowaFest event URL');
  }

  const cached = eventDetailCache.get(rawUrl);
  const now = Date.now();
  if (cached && now - cached.timestamp < 300000) {
    return cached.details;
  }

  const response = await fetch(rawUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch event page (${response.status})`);
  }

  const html = await response.text();

  function extractSection(headingPattern: string): string {
    const regex = new RegExp(`<h4>${headingPattern}<\\/h4>([\\s\\S]*?)(?:<h4>|<div class="footer|<\\/section|$)`, 'i');
    const m = regex.exec(html);
    if (!m) return '';
    return m[1]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const metaDescMatch = /<meta\s+(?:name|property)="description"\s+content="([^"]+)"/i.exec(html);
  const description = decodeHtml(metaDescMatch ? metaDescMatch[1] : '');

  const titleMatch = /<h3[^>]*>\s*([^<]+)\s*<\/h3>/i.exec(html) || /<title>([^<]+)<\/title>/i.exec(html);
  const title = decodeHtml(titleMatch ? titleMatch[1] : '');

  const about = extractSection('About Event');
  const eventsText = extractSection('Events');
  const whoCanAttend = extractSection('Who Can Attend:?');
  const accommodation = extractSection('Accommodation');

  let eventsList: string[] = [];
  if (eventsText) {
    eventsList = eventsText
      .split(/(?:\r?\n|•|\d+\.|\*|;)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && s.length < 120);
  }

  const details = {
    url: rawUrl,
    title,
    description,
    about: about || description,
    eventsList: eventsList.slice(0, 15),
    whoCanAttend,
    accommodation,
  };

  eventDetailCache.set(rawUrl, {
    timestamp: now,
    details,
  });

  return details;
}

export async function proxyKnowaFestPortal(rawUrl: string, loc: string): Promise<string> {
  const normCity = normalizeCity(loc);

  let targetUrl = 'https://www.knowafest.com/explore/events';
  if (rawUrl && rawUrl.startsWith('https://www.knowafest.com')) {
    targetUrl = rawUrl;
  } else if (normCity && normCity !== 'All' && normCity !== 'All Locations') {
    targetUrl = `https://www.knowafest.com/explore/city/${encodeURIComponent(normCity)}`;
  }

  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Unable to load KnowaFest page: ${response.statusText}`);
  }

  let html = await response.text();

  const baseHref = targetUrl.includes('/explore/city/')
    ? 'https://www.knowafest.com/explore/'
    : 'https://www.knowafest.com/';

  if (html.includes('<head>')) {
    html = html.replace(
      '<head>',
      `<head>\n<base href="${baseHref}">\n<style>
        body { -webkit-font-smoothing: antialiased; }
      </style>`
    );
  } else {
    html = `<base href="${baseHref}">` + html;
  }

  html = html.replace(/<a\s+(?!.*?target=)/gi, '<a target="_blank" ');
  return html;
}
