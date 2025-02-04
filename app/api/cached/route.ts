import { NextResponse } from 'next/server';

// An example API route with caching headers to boost performance.
export async function GET() {
  const response = NextResponse.json({ message: 'Esta ruta está cachéada' });
  // Set caching headers for 1 hour + stale revalidation.
  response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=59');
  return response;
} 