import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://capital-code.vercel.app'; // Replace with your actual base URL

  const pages = [
    { path: '/', lastModified: new Date().toISOString() },
    { path: '/showcase', lastModified: new Date().toISOString() },
    { path: '/meeting', lastModified: new Date().toISOString() },
    // Add more paths as needed
  ];

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap-image/1.1">
      ${pages
        .map(({ path, lastModified }) => `
        <url>
          <loc>${baseUrl}${path}</loc>
          <lastmod>${lastModified}</lastmod>
        </url>
      `)
        .join('')}
    </urlset>
  `;

  return NextResponse.json(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
