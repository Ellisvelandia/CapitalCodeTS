import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/private/',
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/private/', '/admin/'],
      },
      {
        userAgent: ['Bingbot', 'Yandex'],
        allow: ['/'],
        disallow: ['/private/', '/internal/'],
      },
    ],
    sitemap: 'https://capital-code-ts.vercel.app/sitemap.xml',
    host: 'https://capital-code-ts.vercel.app',
  }
}
