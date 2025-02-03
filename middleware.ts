import { NextRequest, NextResponse } from 'next/server';

// This middleware rewrites /blog routes for a more SEO-optimized version.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // If pathname starts with /blog, rewrite to /blog-optimized 
  if (pathname.startsWith('/blog')) {
    const url = req.nextUrl.clone();
    url.pathname = '/blog-optimized' + pathname.slice(5); // Preserve any path after /blog
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
} 