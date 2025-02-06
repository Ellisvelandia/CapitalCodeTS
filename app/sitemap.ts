// app/sitemap.xml.ts
export async function GET() {
  const baseUrl = "https://capital-code.vercel.app"; // Replace with your actual base URL

  const pages = [
    { path: "/", lastModified: new Date().toISOString() },
    { path: "/showcase", lastModified: new Date().toISOString() },
    { path: "/meeting", lastModified: new Date().toISOString() },
    // Add more paths as needed
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
      .map(
        ({ path, lastModified }) => `
      <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${lastModified}</lastmod>
      </url>`
      )
      .join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: { "Content-Type": "application/xml" },
  });
}
