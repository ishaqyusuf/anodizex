import { appMetadata, siteRootDomain } from "@anodizex/utils";
import type { Metadata, MetadataRoute } from "next";

export const siteUrl = `https://www.${siteRootDomain}`;
export const socialImage = {
  alt: "Anodizex - premium aluminium architectural systems",
  height: 630,
  path: "/opengraph-image",
  width: 1200,
} as const;

export type PublicRoute = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: string;
};

export const publicRoutes: PublicRoute[] = [
  {
    path: "/",
    priority: 1,
    changeFrequency: "weekly",
    lastModified: "2026-07-02",
  },
  {
    path: "/contact",
    priority: 0.9,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/projects/lagoon-house-sliding-systems",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/projects/atrium-commercial-facade",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/projects/courtyard-entrance-doors",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/blog/choosing-aluminium-systems",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/blog/facade-planning-checklist",
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: "2026-07-02",
  },
  {
    path: "/privacy",
    priority: 0.2,
    changeFrequency: "yearly",
    lastModified: "2026-06-09",
  },
  {
    path: "/terms",
    priority: 0.2,
    changeFrequency: "yearly",
    lastModified: "2026-06-09",
  },
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function createPageMetadata({
  description,
  noIndex = false,
  path,
  title,
}: {
  description: string;
  noIndex?: boolean;
  path: string;
  title: string;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(socialImage.path);

  return {
    alternates: {
      canonical: url,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: socialImage.alt,
          height: socialImage.height,
          url: imageUrl,
          width: socialImage.width,
        },
      ],
      locale: "en_US",
      siteName: appMetadata.name,
      title,
      type: "website",
      url,
    },
    robots: noIndex
      ? {
          follow: false,
          index: false,
          nocache: true,
        }
      : {
          follow: true,
          index: true,
        },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [
        {
          alt: socialImage.alt,
          url: imageUrl,
        },
      ],
      title,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    email: "hello@anodizex.com",
    name: appMetadata.name,
    url: siteUrl,
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    description: appMetadata.description,
    name: appMetadata.name,
    url: siteUrl,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteUrl(item.path),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function faqJsonLd(items: Array<{ answer: string; question: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
      name: item.question,
    })),
  };
}

export function articleJsonLd({
  description,
  path,
  title,
}: {
  description: string;
  path: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    dateModified: "2026-06-18",
    datePublished: "2026-06-09",
    description,
    headline: title.replace(" | afterservice", "").replace(" | Anodizex", ""),
    mainEntityOfPage: absoluteUrl(path),
    publisher: {
      "@type": "Organization",
      name: appMetadata.name,
      url: siteUrl,
    },
  };
}
