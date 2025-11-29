import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fake Browser Headers (The "Camouflage")
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    };

    // 2. Fetch with headers
    const response = await fetch(url, { headers });

    // Handle "Access Denied" (403) or other errors gracefully
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Site blocked the scraper. Please enter details manually.' },
        { status: 422 } // 422 = Unprocessable Entity (valid request, but can't process)
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 3. Extract Metadata (Try multiple sources)
    
    // Strategy A: Open Graph Tags (Standard)
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    
    // Strategy B: Twitter Card Tags (Fallback)
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');

    // Strategy C: Standard HTML Tags (Last Resort)
    const titleTag = $('title').text();
    const firstImage = $('img').first().attr('src');

    // Strategy D: JSON-LD (Structured Data for Google)
    // Many e-commerce sites put product data here even if they block other tags
    let jsonLdImage = null;
    let jsonLdTitle = null;
    try {
      $('script[type="application/ld+json"]').each((i, el) => {
        const data = JSON.parse($(el).html());
        if (data['@type'] === 'Product') {
          jsonLdTitle = data.name;
          jsonLdImage = Array.isArray(data.image) ? data.image[0] : data.image;
        }
      });
    } catch (e) {
      // Ignore JSON parse errors
    }

    // 4. Prioritize the best data found
    const title = ogTitle || twitterTitle || jsonLdTitle || titleTag || 'Unknown Product';
    
    // Fix relative image URLs (e.g., "/images/shirt.jpg" -> "https://site.com/images/shirt.jpg")
    let image = ogImage || twitterImage || jsonLdImage || firstImage || '';
    if (image && image.startsWith('/')) {
      const urlObj = new URL(url);
      image = `${urlObj.protocol}//${urlObj.host}${image}`;
    }

    // If we still have no image, send a placeholder
    if (!image) {
      image = 'https://via.placeholder.com/400x300?text=No+Image+Found';
    }

    return NextResponse.json({ title, image, url });

  } catch (error) {
    console.error('Scrape Error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape product details.' },
      { status: 500 }
    );
  }
}