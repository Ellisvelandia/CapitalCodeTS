import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `
    User-agent: *
    Allow: /
    Disallow: /private/
  `;

  return NextResponse.json(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}