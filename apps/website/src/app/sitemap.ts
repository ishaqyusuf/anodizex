import type { MetadataRoute } from "next";
import { absoluteUrl, publicRoutes } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    changeFrequency: route.changeFrequency,
    lastModified: route.lastModified,
    priority: route.priority,
    url: absoluteUrl(route.path),
  }));
}
