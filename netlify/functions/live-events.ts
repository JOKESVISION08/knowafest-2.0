import { Handler } from '@netlify/functions';
import * as cheerio from 'cheerio';

export const handler: Handler = async (event) => {
  const location = event.queryStringParameters?.location || 'coimbatore';
  const targetUrl = `https://www.knowafest.com/explore/city/${encodeURIComponent(location)}`;

  try {
    const response = await fetch(targetUrl, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
    });
    
    if (!response.ok) throw new Error('Failed to fetch from KnowaFest');
    
    const html = await response.text();
    console.log("Scraped HTML length:", html.length); 

    const $ = cheerio.load(html);
    const rowCount = $('table tbody tr').length;
    console.log("Found table rows:", rowCount);
    
    const events: any[] = [];
    
    // Try targeting common event item classes if table is not used
    $('.event-item, .event-card, table tbody tr').each((_, el) => {
      const cells = $(el).find('td');
      // If it's a table row, it will have cells. If it's a div, this will be empty, 
      // and we would need a different parsing strategy for those items.
      if (cells.length >= 3) {
        const titleEl = $(cells[0]).find('a');
        const title = titleEl.text().trim();
        const link = titleEl.attr('href');
        
        if (title) {
          events.push({
            id: `kf-${location.toLowerCase()}-${_}`,
            title,
            knowafestUrl: link?.startsWith('http') ? link : `https://www.knowafest.com${link}`,
            college: $(cells[1]).text().trim(),
            date: $(cells[2]).text().trim(),
            category: 'Technical Symposium',
            city: location
          });
        }
      }
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({ success: true, events, url: targetUrl }),
    };
  } catch (err: any) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ success: false, error: 'Scraping failed', message: err.message }) 
    };
  }
};
