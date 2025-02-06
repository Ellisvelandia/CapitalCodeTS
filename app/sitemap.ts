// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://capital-code.vercel.app";

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/showcase`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/meeting`,
      lastModified: new Date(),
    },
    // Add more entries
  ];
}
