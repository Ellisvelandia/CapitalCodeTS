import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import FloatingWhatsApp from "@/components/floating-whatsapp";
import Chat from "@/components/Chat";

const font = Space_Grotesk({ subsets: ["latin"] });

// Global SEO defaults in Spanish
export const metadata: Metadata = {
  metadataBase: new URL('https://capital-code.vercel.app'),
  title: "Capital Code | Desarrollo de Software y Sitios Web Personalizados",
  description: "Expertos en desarrollo de software y sitios web personalizados para empresas e individuos. Transformamos ideas en soluciones tecnológicas innovadoras.",
  keywords: ['SEO', 'sitio web', 'contenido en español'],
  alternates: {
    canonical: 'https://capital-code.vercel.app',
  },
  openGraph: {
    title: "Capital Code | Desarrollo de Software",
    description: "Expertos en desarrollo de software y sitios web personalizados",
    url: 'https://capital-code.vercel.app/',
    siteName: 'Capital Code',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/logo/logo.webp',
        width: 1200,
        height: 630,
        alt: 'Capital Code - Desarrollo de Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capital Code | Desarrollo de Software',
    description: 'Expertos en desarrollo de software y sitios web personalizados',
    images: ['/logo/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,  
    },
  },
  icons: {
    icon: '/logo/logo.ico',
    shortcut: '/logo/logo.ico',
    apple: '/logo/logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={font.className}>

        {children}
        <FloatingWhatsApp />
        <Chat />
        <Analytics />

      </body>
    </html>
  );
}
