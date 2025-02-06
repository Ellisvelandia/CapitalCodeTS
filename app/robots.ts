// app/robots.txt.ts
export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /private/`;

  return new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
}
