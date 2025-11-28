import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GiftBoard/1.0)',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Metadata
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const titleTag = $('title').text();
    const ogImage = $('meta[property="og:image"]').attr('content');
    
    // Fallback logic
    const title = ogTitle || titleTag || 'Unknown Product';
    const image = ogImage || 'https://via.placeholder.com/400x300?text=No+Image';

    return NextResponse.json({ title, image, url });
  } catch (error) {
    console.error('Scrape Error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape product details.' },
      { status: 500 }
    );
  }
}