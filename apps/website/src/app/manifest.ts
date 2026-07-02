import { appMetadata } from "@afterservice/utils";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    categories: ["business", "productivity"],
    description: appMetadata.description,
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    icons: [
      {
        purpose: "any",
        sizes: "192x192",
        src: "/icons/icon-192.png",
        type: "image/png",
      },
      {
        purpose: "any",
        sizes: "512x512",
        src: "/icons/icon-512.png",
        type: "image/png",
      },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "/icons/maskable-512.png",
        type: "image/png",
      },
    ],
    id: "/",
    lang: "en-US",
    name: appMetadata.name,
    orientation: "portrait-primary",
    prefer_related_applications: false,
    related_applications: [],
    scope: "/",
    short_name: appMetadata.name,
    start_url: "/?source=pwa",
    theme_color: "#009b98",
  };
}
