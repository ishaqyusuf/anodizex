import {
  getDashboardOverview,
  getDbClient,
  type Prisma,
  type WorkspacePlan,
} from "@anodizex/db";
import { LogEvents } from "@anodizex/events";
import { setupAnalytics } from "@anodizex/events/server";
import { EmailService, Notifications } from "@anodizex/notifications";
import { tasks } from "@trigger.dev/sdk/v3";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { ApiContext } from "../context";
import {
  contactInquirySchema,
  createBlogPostSchema,
  createGalleryItemSchema,
  createProjectQuotationSchema,
  createQuotationMaterialSchema,
  createQuotationMaterialSupplierPriceSchema,
  createProjectMediaSchema,
  createWebsiteProjectSchema,
  projectQuotationStatusSchema,
  reorderWebsiteItemsSchema,
  updateBlogPostSchema,
  updateGalleryItemSchema,
  updateProjectQuotationSchema,
  updateProjectQuotationStatusSchema,
  updateQuotationMaterialCostSchema,
  updateQuotationMaterialSchema,
  updateQuotationMaterialSupplierPriceSchema,
  updateProjectMediaSchema,
  updateWebsiteProjectSchema,
  websiteSettingsSchema,
} from "../schemas";
import { polarApi } from "../utils/polar";

const t = initTRPC.context<ApiContext>().create({
  transformer: superjson,
});

const db = getDbClient();
const notifications = new Notifications(db);
const emailService = new EmailService();

const channelSchema = z.enum(["email", "sms", "phone", "whatsapp"]);
const followUpStatusSchema = z.enum([
  "open",
  "scheduled",
  "sent",
  "replied",
  "closed",
  "missed",
]);
const serviceJobStatusSchema = z.enum([
  "completed",
  "needs_follow_up",
  "resolved",
]);

const planLimits: Record<
  WorkspacePlan,
  {
    customers: number;
    followUps: number;
    teamMembers: number;
    templates: number;
  }
> = {
  growth: {
    customers: 2000,
    followUps: 7500,
    teamMembers: 5,
    templates: 50,
  },
  pro: {
    customers: 10000,
    followUps: 30000,
    teamMembers: 15,
    templates: 150,
  },
  starter: {
    customers: 100,
    followUps: 200,
    teamMembers: 1,
    templates: 5,
  },
};

function publicPlanName(plan: WorkspacePlan, planStatus?: string | null) {
  if (plan === "starter") {
    return planStatus === "active" ? "Starter" : "Free Beta";
  }

  if (plan === "growth") return "Shop";
  if (plan === "pro") return "Growth";

  return plan;
}

function iso(date: Date | null | undefined) {
  return date?.toISOString() ?? null;
}

type SortDirection = "asc" | "desc";
type SortOrderInput =
  | Prisma.CustomerOrderByWithRelationInput
  | Prisma.FollowUpOrderByWithRelationInput
  | Prisma.FollowUpTemplateOrderByWithRelationInput
  | Prisma.ServiceJobOrderByWithRelationInput;
type SortFactory<TOrderBy extends SortOrderInput> = (
  direction: SortDirection,
) => TOrderBy;

function resolveSort<TOrderBy extends SortOrderInput>(
  sort: string[] | null | undefined,
  factories: Record<string, SortFactory<TOrderBy>>,
  fallback: TOrderBy | TOrderBy[],
) {
  const [field, direction] = sort ?? [];

  if (direction !== "asc" && direction !== "desc") {
    return fallback;
  }

  return field ? (factories[field]?.(direction) ?? fallback) : fallback;
}

const customerSorts: Record<
  string,
  SortFactory<Prisma.CustomerOrderByWithRelationInput>
> = {
  companyName: (direction) => ({ companyName: direction }),
  createdAt: (direction) => ({ createdAt: direction }),
  email: (direction) => ({ email: direction }),
  name: (direction) => ({ name: direction }),
  phone: (direction) => ({ phone: direction }),
};

const serviceJobSorts: Record<
  string,
  SortFactory<Prisma.ServiceJobOrderByWithRelationInput>
> = {
  amountCents: (direction) => ({ amountCents: direction }),
  completedAt: (direction) => ({ completedAt: direction }),
  status: (direction) => ({ status: direction }),
  title: (direction) => ({ title: direction }),
};

const followUpSorts: Record<
  string,
  SortFactory<Prisma.FollowUpOrderByWithRelationInput>
> = {
  channel: (direction) => ({ channel: direction }),
  dueAt: (direction) => ({ dueAt: direction }),
  status: (direction) => ({ status: direction }),
};

const templateSorts: Record<
  string,
  SortFactory<Prisma.FollowUpTemplateOrderByWithRelationInput>
> = {
  channel: (direction) => ({ channel: direction }),
  name: (direction) => ({ name: direction }),
  subject: (direction) => ({ subject: direction }),
};

const anodizexFallbackSettings = {
  addressLine1: "Lagos Design Studio, Victoria Island",
  addressLine2: "",
  city: "Lagos",
  companyName: "Anodizex",
  country: "Nigeria",
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  description:
    "Premium aluminium windows, sliding systems, doors, facades, and architectural glazing for residential and commercial projects.",
  email: "hello@anodizex.com",
  headline: "Architectural aluminium systems for modern buildings",
  heroImageUrl:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80",
  id: "fallback-settings",
  instagramUrl: "",
  linkedinUrl: "",
  mapUrl: "",
  officeHours: "Monday to Friday, 9:00 AM - 5:00 PM",
  phone: "+234 800 000 0000",
  region: "Lagos",
  updatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  whatsappUrl: "",
  workspaceId: "fallback",
} as const;

const fallbackProjects = [
  {
    clientName: "Private residence",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    description:
      "A residential glazing package combining thermally improved aluminium windows, lift-and-slide doors, and coordinated balcony openings.",
    id: "fallback-project-lagoon",
    location: "Lagos, Nigeria",
    log: "Surveyed existing openings\nCoordinated profiles with the facade team\nInstalled sliding systems and sealed perimeter joints\nCompleted handover with care documentation",
    media: [
      {
        alt: "Modern residence with large aluminium sliding systems",
        caption: "Lift-and-slide openings facing the terrace.",
        createdAt: "2026-01-01T00:00:00.000Z",
        id: "fallback-project-lagoon-media-1",
        mediaType: "image",
        sortOrder: 0,
        thumbnailUrl: "",
        updatedAt: "2026-01-01T00:00:00.000Z",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
      },
    ],
    publishedAt: "2026-01-01T00:00:00.000Z",
    serviceType: "Sliding systems and windows",
    slug: "lagoon-house-sliding-systems",
    sortOrder: 0,
    status: "completed",
    summary:
      "Slim aluminium sliding systems and window packages for a warm, light-filled private home.",
    title: "Lagoon House Sliding Systems",
    updatedAt: "2026-01-01T00:00:00.000Z",
    year: 2026,
  },
  {
    clientName: "Commercial developer",
    coverImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2025-01-01T00:00:00.000Z",
    description:
      "A commercial entrance and curtain wall package designed for durability, clear sightlines, and fast maintenance access.",
    id: "fallback-project-atrium",
    location: "Abuja, Nigeria",
    log: "Mapped facade grid and entrance loads\nPrepared shop drawings for approval\nInstalled curtain wall bays in staged lifts\nCompleted glazing inspection and access review",
    media: [],
    publishedAt: "2025-01-01T00:00:00.000Z",
    serviceType: "Facade and entrances",
    slug: "atrium-commercial-facade",
    sortOrder: 1,
    status: "completed",
    summary:
      "A clean aluminium curtain wall and entrance system for a compact commercial atrium.",
    title: "Atrium Commercial Facade",
    updatedAt: "2025-01-01T00:00:00.000Z",
    year: 2025,
  },
  {
    clientName: "Hospitality operator",
    coverImageUrl:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2024-01-01T00:00:00.000Z",
    description:
      "Large-format doors and aluminium frames configured for frequent use, clean thresholds, and strong daylight control.",
    id: "fallback-project-courtyard",
    location: "Lekki, Nigeria",
    log: "Reviewed hospitality traffic patterns\nSpecified reinforced door hardware\nInstalled aluminium frames and glazed doors\nAdjusted closers and completed final walkthrough",
    media: [],
    publishedAt: "2024-01-01T00:00:00.000Z",
    serviceType: "Doors and storefront systems",
    slug: "courtyard-entrance-doors",
    sortOrder: 2,
    status: "completed",
    summary:
      "Robust aluminium entrance doors and storefront framing for a hospitality courtyard.",
    title: "Courtyard Entrance Doors",
    updatedAt: "2024-01-01T00:00:00.000Z",
    year: 2024,
  },
] as const;

const fallbackGallery = [
  {
    alt: "Premium aluminium sliding doors opening to a terrace",
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "Large opening systems for residential terraces.",
    id: "fallback-gallery-1",
    isFeatured: true,
    mediaType: "image",
    projectId: "fallback-project-lagoon",
    sortOrder: 0,
    thumbnailUrl: "",
    title: "Terrace Sliding System",
    updatedAt: "2026-01-01T00:00:00.000Z",
    url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    alt: "Modern commercial glass facade with aluminium framing",
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "Commercial facade framing with clear sightlines.",
    id: "fallback-gallery-2",
    isFeatured: true,
    mediaType: "image",
    projectId: "fallback-project-atrium",
    sortOrder: 1,
    thumbnailUrl: "",
    title: "Commercial Facade Grid",
    updatedAt: "2026-01-01T00:00:00.000Z",
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    alt: "Aluminium framed entrance with glass doors",
    createdAt: "2026-01-01T00:00:00.000Z",
    description: "Durable glazed doors for high-traffic entrances.",
    id: "fallback-gallery-3",
    isFeatured: true,
    mediaType: "image",
    projectId: "fallback-project-courtyard",
    sortOrder: 2,
    thumbnailUrl: "",
    title: "Entrance Door Package",
    updatedAt: "2026-01-01T00:00:00.000Z",
    url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

const fallbackBlogPosts = [
  {
    authorName: "Anodizex",
    content:
      "Aluminium systems are selected for strength, clean profiles, corrosion resistance, and long service life. For project planning, the most important early decision is matching each opening to its use: ventilation, access, daylight, privacy, security, and maintenance.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    excerpt:
      "A practical guide to matching aluminium windows, doors, and facade systems to the way each building will be used.",
    id: "fallback-blog-1",
    publishedAt: "2026-01-01T00:00:00.000Z",
    slug: "choosing-aluminium-systems",
    sortOrder: 0,
    title: "Choosing Aluminium Systems for Your Building",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    authorName: "Anodizex",
    content:
      "A stronger facade outcome starts before fabrication. Align the profile selection, shop drawings, anchoring strategy, drainage paths, and glass specification early so site work is faster and revisions are fewer.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
    excerpt:
      "What clients, architects, and contractors should align before aluminium facade work begins.",
    id: "fallback-blog-2",
    publishedAt: "2025-01-01T00:00:00.000Z",
    slug: "facade-planning-checklist",
    sortOrder: 1,
    title: "Facade Planning Checklist Before Fabrication",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorCause(error: unknown) {
  return isRecord(error) ? error.cause : undefined;
}

function isDatabaseConnectionError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (isRecord(current)) {
      if (current.code === "P1001") {
        return true;
      }

      if (
        typeof current.message === "string" &&
        current.message.includes("Can't reach database server")
      ) {
        return true;
      }
    }

    current = getErrorCause(current);
  }

  return false;
}

function fallbackLandingContent() {
  return {
    item: {
      blogPosts: fallbackBlogPosts,
      gallery: fallbackGallery,
      projects: fallbackProjects,
      settings: anodizexFallbackSettings,
    },
  };
}

function logWebsiteDatabaseFallback(procedure: string, error: unknown) {
  console.warn(
    `[website.${procedure}] Database unavailable; serving fallback content.`,
    error instanceof Error ? error.message : String(error),
  );
}

async function withWebsiteReadFallback<T>(
  procedure: string,
  query: () => Promise<T>,
  fallback: () => T,
) {
  try {
    return await query();
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      logWebsiteDatabaseFallback(procedure, error);
      return fallback();
    }

    throw error;
  }
}

function requireOwnerOrAdmin(ctx: ApiContext) {
  if (ctx.workspace?.role !== "owner" && ctx.workspace?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner or admin access is required.",
    });
  }
}

function optionalValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

function optionalDateValue(value: string | null | undefined) {
  const trimmed = optionalValue(value);
  if (!trimmed) return null;

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tagsFromInput(value: string | null | undefined) {
  return (
    value
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || `item-${crypto.randomUUID().slice(0, 8)}`
  );
}

async function uniqueProjectSlug({
  id,
  slug,
  title,
  workspaceId,
}: {
  id?: string;
  slug?: string | null;
  title: string;
  workspaceId: string;
}) {
  const base = slugify(slug || title);
  const existing = await db.websiteProject.findFirst({
    select: { id: true },
    where: {
      slug: base,
      workspaceId,
      ...(id ? { NOT: { id } } : {}),
    },
  });

  return existing ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
}

async function uniqueBlogSlug({
  id,
  slug,
  title,
  workspaceId,
}: {
  id?: string;
  slug?: string | null;
  title: string;
  workspaceId: string;
}) {
  const base = slugify(slug || title);
  const existing = await db.blogPost.findFirst({
    select: { id: true },
    where: {
      slug: base,
      workspaceId,
      ...(id ? { NOT: { id } } : {}),
    },
  });

  return existing ? `${base}-${crypto.randomUUID().slice(0, 6)}` : base;
}

function websiteSettingsDto(settings: {
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  companyName: string;
  country: string;
  createdAt: Date;
  description: string;
  email: string;
  headline: string;
  heroImageUrl?: string | null;
  id: string;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  mapUrl?: string | null;
  officeHours: string;
  phone: string;
  region?: string | null;
  updatedAt: Date;
  whatsappUrl?: string | null;
  workspaceId: string;
}) {
  return {
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2 ?? "",
    city: settings.city ?? "",
    companyName: settings.companyName,
    country: settings.country,
    createdAt: settings.createdAt.toISOString(),
    description: settings.description,
    email: settings.email,
    headline: settings.headline,
    heroImageUrl: settings.heroImageUrl ?? "",
    id: settings.id,
    instagramUrl: settings.instagramUrl ?? "",
    linkedinUrl: settings.linkedinUrl ?? "",
    mapUrl: settings.mapUrl ?? "",
    officeHours: settings.officeHours,
    phone: settings.phone,
    region: settings.region ?? "",
    updatedAt: settings.updatedAt.toISOString(),
    whatsappUrl: settings.whatsappUrl ?? "",
    workspaceId: settings.workspaceId,
  };
}

function galleryItemDto(item: {
  alt?: string | null;
  blobPathname?: string | null;
  capturedAt?: Date | null;
  createdAt: Date;
  dateSource?: string | null;
  description?: string | null;
  id: string;
  isFeatured: boolean;
  mediaType: string;
  project?: { slug: string; title: string } | null;
  projectId?: string | null;
  sourceProvider?: string | null;
  sortOrder: number;
  tags?: string[];
  thumbnailUrl?: string | null;
  title: string;
  updatedAt: Date;
  url: string;
}) {
  return {
    alt: item.alt ?? "",
    blobPathname: item.blobPathname ?? "",
    capturedAt: iso(item.capturedAt),
    createdAt: item.createdAt.toISOString(),
    dateSource: item.dateSource ?? "",
    description: item.description ?? "",
    id: item.id,
    isFeatured: item.isFeatured,
    mediaType: item.mediaType,
    project: item.project
      ? { slug: item.project.slug, title: item.project.title }
      : null,
    projectId: item.projectId ?? "",
    sourceProvider: item.sourceProvider ?? "",
    sortOrder: item.sortOrder,
    tags: item.tags ?? [],
    thumbnailUrl: item.thumbnailUrl ?? "",
    title: item.title,
    updatedAt: item.updatedAt.toISOString(),
    url: item.url,
  };
}

function projectMediaDto(item: {
  alt?: string | null;
  caption?: string | null;
  createdAt: Date;
  id: string;
  mediaType: string;
  sortOrder: number;
  thumbnailUrl?: string | null;
  updatedAt: Date;
  url: string;
}) {
  return {
    alt: item.alt ?? "",
    caption: item.caption ?? "",
    createdAt: item.createdAt.toISOString(),
    id: item.id,
    mediaType: item.mediaType,
    sortOrder: item.sortOrder,
    thumbnailUrl: item.thumbnailUrl ?? "",
    updatedAt: item.updatedAt.toISOString(),
    url: item.url,
  };
}

function projectDto(project: {
  clientName?: string | null;
  coverImageUrl?: string | null;
  createdAt: Date;
  description?: string | null;
  id: string;
  location?: string | null;
  log?: string | null;
  media?: Array<Parameters<typeof projectMediaDto>[0]>;
  publishedAt?: Date | null;
  serviceType?: string | null;
  slug: string;
  sortOrder: number;
  status: string;
  summary: string;
  title: string;
  updatedAt: Date;
  year: number;
}) {
  return {
    clientName: project.clientName ?? "",
    coverImageUrl: project.coverImageUrl ?? "",
    createdAt: project.createdAt.toISOString(),
    description: project.description ?? "",
    id: project.id,
    location: project.location ?? "",
    log: project.log ?? "",
    media: project.media?.map(projectMediaDto) ?? [],
    publishedAt: iso(project.publishedAt),
    serviceType: project.serviceType ?? "",
    slug: project.slug,
    sortOrder: project.sortOrder,
    status: project.status,
    summary: project.summary,
    title: project.title,
    updatedAt: project.updatedAt.toISOString(),
    year: project.year,
  };
}

function blogPostDto(post: {
  authorName: string;
  content: string;
  coverImageUrl?: string | null;
  createdAt: Date;
  excerpt: string;
  id: string;
  publishedAt?: Date | null;
  slug: string;
  sortOrder: number;
  title: string;
  updatedAt: Date;
}) {
  return {
    authorName: post.authorName,
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? "",
    createdAt: post.createdAt.toISOString(),
    excerpt: post.excerpt,
    id: post.id,
    publishedAt: iso(post.publishedAt),
    slug: post.slug,
    sortOrder: post.sortOrder,
    title: post.title,
    updatedAt: post.updatedAt.toISOString(),
  };
}

function inquiryDto(inquiry: {
  adminEmailStatus?: string | null;
  companyName?: string | null;
  createdAt: Date;
  customerEmailStatus?: string | null;
  email: string;
  id: string;
  message: string;
  name: string;
  phone?: string | null;
  projectType?: string | null;
  status: string;
  updatedAt: Date;
}) {
  return {
    adminEmailStatus: inquiry.adminEmailStatus ?? "",
    companyName: inquiry.companyName ?? "",
    createdAt: inquiry.createdAt.toISOString(),
    customerEmailStatus: inquiry.customerEmailStatus ?? "",
    email: inquiry.email,
    id: inquiry.id,
    message: inquiry.message,
    name: inquiry.name,
    phone: inquiry.phone ?? "",
    projectType: inquiry.projectType ?? "",
    status: inquiry.status,
    updatedAt: inquiry.updatedAt.toISOString(),
  };
}

async function getOrCreateWebsiteSettings(workspaceId: string) {
  const existing = await db.websiteSettings.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    return existing;
  }

  return db.websiteSettings.create({
    data: {
      addressLine1: anodizexFallbackSettings.addressLine1,
      addressLine2: anodizexFallbackSettings.addressLine2,
      city: anodizexFallbackSettings.city,
      companyName: anodizexFallbackSettings.companyName,
      country: anodizexFallbackSettings.country,
      description: anodizexFallbackSettings.description,
      email: anodizexFallbackSettings.email,
      headline: anodizexFallbackSettings.headline,
      heroImageUrl: anodizexFallbackSettings.heroImageUrl,
      officeHours: anodizexFallbackSettings.officeHours,
      phone: anodizexFallbackSettings.phone,
      region: anodizexFallbackSettings.region,
      workspaceId,
    },
  });
}

function contactAdminBody(input: z.infer<typeof contactInquirySchema>) {
  return [
    "New Anodizex website enquiry",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Phone: ${input.phone}` : null,
    input.companyName ? `Company: ${input.companyName}` : null,
    input.projectType ? `Project type: ${input.projectType}` : null,
    "",
    "Message:",
    input.message,
  ]
    .filter(Boolean)
    .join("\n");
}

function contactCustomerBody(input: z.infer<typeof contactInquirySchema>) {
  return [
    `Hello ${input.name},`,
    "",
    "Thank you for contacting Anodizex. We received your project enquiry and our team will review the details shortly.",
    "",
    "Your message:",
    input.message,
    "",
    "Regards,",
    "The Anodizex team",
  ].join("\n");
}

const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!ctx.workspace) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Workspace onboarding is required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      workspace: ctx.workspace,
    },
  });
});

async function getWorkspaceForLimits(workspaceId: string) {
  const workspace = await db.workspace.findUniqueOrThrow({
    select: {
      businessType: true,
      defaultFollowUpDelayDays: true,
      id: true,
      name: true,
      plan: true,
      planStatus: true,
      serviceCategory: true,
    },
    where: { id: workspaceId },
  });

  return {
    ...workspace,
    limits: planLimits[workspace.plan],
  };
}

async function assertUnderLimit(
  workspaceId: string,
  key: keyof (typeof planLimits)["starter"],
) {
  const workspace = await getWorkspaceForLimits(workspaceId);
  const count =
    key === "customers"
      ? await db.customer.count({ where: { archivedAt: null, workspaceId } })
      : key === "followUps"
        ? await db.followUp.count({ where: { workspaceId } })
        : key === "templates"
          ? await db.followUpTemplate.count({ where: { workspaceId } })
          : await db.membership.count({ where: { workspaceId } });

  if (count >= workspace.limits[key]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${publicPlanName(workspace.plan, workspace.planStatus)} plan limit for ${key} has been reached.`,
    });
  }
}

function customerDto(customer: {
  archivedAt?: Date | null;
  companyName?: string | null;
  createdAt: Date;
  email?: string | null;
  followUps?: Array<{ status: string }>;
  id: string;
  lastServiceAt?: Date | null;
  name: string;
  notes?: string | null;
  phone?: string | null;
  tags: string[];
  updatedAt: Date;
}) {
  return {
    archivedAt: iso(customer.archivedAt),
    companyName: customer.companyName ?? null,
    createdAt: customer.createdAt.toISOString(),
    email: customer.email ?? null,
    id: customer.id,
    lastServiceAt: iso(customer.lastServiceAt),
    name: customer.name,
    notes: customer.notes ?? null,
    openFollowUpCount:
      customer.followUps?.filter((item) => item.status !== "closed").length ??
      0,
    phone: customer.phone ?? null,
    tags: customer.tags,
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function followUpDto(followUp: {
  assigneeId?: string | null;
  channel: string;
  closedAt?: Date | null;
  createdAt: Date;
  customer: { id: string; name: string };
  dueAt: Date;
  events?: Array<{
    actorId?: string | null;
    createdAt: Date;
    id: string;
    metadata?: unknown;
    type: string;
  }>;
  id: string;
  job?: { id: string; title: string } | null;
  messageLogs?: Array<{
    body: string;
    createdAt: Date;
    id: string;
    recipient: string;
    status: string;
  }>;
  notes?: string | null;
  sentAt?: Date | null;
  status: string;
  template?: { id: string; name: string } | null;
  updatedAt: Date;
}) {
  return {
    assigneeId: followUp.assigneeId ?? null,
    channel: followUp.channel,
    closedAt: iso(followUp.closedAt),
    createdAt: followUp.createdAt.toISOString(),
    customerId: followUp.customer.id,
    customerName: followUp.customer.name,
    dueAt: followUp.dueAt.toISOString(),
    events:
      followUp.events?.map((event) => ({
        actorId: event.actorId ?? null,
        createdAt: event.createdAt.toISOString(),
        id: event.id,
        metadata: event.metadata ?? null,
        type: event.type,
      })) ?? [],
    id: followUp.id,
    messageLogs:
      followUp.messageLogs?.map((log) => ({
        body: log.body,
        createdAt: log.createdAt.toISOString(),
        id: log.id,
        recipient: log.recipient,
        status: log.status,
      })) ?? [],
    notes: followUp.notes ?? null,
    sentAt: iso(followUp.sentAt),
    serviceTitle: followUp.job?.title ?? null,
    status: followUp.status,
    templateName: followUp.template?.name ?? null,
    updatedAt: followUp.updatedAt.toISOString(),
  };
}

type QuotationInput = z.infer<typeof createProjectQuotationSchema>;
type QuotationUnitInput = QuotationInput["units"][number];
type QuotationLineInput = QuotationUnitInput["materialLines"][number];

type QuotationMaterialSnapshot = {
  currentUnitCostCents: number;
  id: string;
  name: string;
  supplier?: string | null;
  unit: string;
};

type QuotationSupplierPriceSnapshot = {
  currency: string;
  id: string;
  material: QuotationMaterialSnapshot;
  materialId: string;
  supplierName: string;
  supplierSku?: string | null;
  unitCostCents: number;
};

function normalizeCents(value: number | null | undefined) {
  return Math.max(0, Math.round(value ?? 0));
}

function markupBpsFromPercent(value: number) {
  return Math.max(0, Math.round(value * 100));
}

function percentFromMarkupBps(value: number) {
  return value / 100;
}

function calculateMarkup(subtotalCents: number, markupBps: number) {
  return Math.round((subtotalCents * markupBps) / 10_000);
}

function calculateLineTotalCents(
  line: QuotationLineInput,
  unitQuantity: number,
  unitCostCents: number,
) {
  const quantity = Math.max(0, line.quantity);
  const wasteMultiplier = 1 + Math.max(0, line.wastePercent ?? 0) / 100;

  return Math.round(quantity * unitQuantity * unitCostCents * wasteMultiplier);
}

async function getQuotationMaterialsById(
  workspaceId: string,
  materialIds: string[],
) {
  if (!materialIds.length) {
    return new Map<string, QuotationMaterialSnapshot>();
  }

  const materials = await db.quotationMaterial.findMany({
    select: {
      currentUnitCostCents: true,
      id: true,
      name: true,
      supplier: true,
      unit: true,
    },
    where: {
      archivedAt: null,
      id: { in: materialIds },
      workspaceId,
    },
  });
  const materialMap = new Map(materials.map((item) => [item.id, item]));
  const missingMaterial = materialIds.find((id) => !materialMap.has(id));

  if (missingMaterial) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more selected materials are unavailable.",
    });
  }

  return materialMap;
}

async function getQuotationSupplierPricesById(
  workspaceId: string,
  supplierPriceIds: string[],
) {
  if (!supplierPriceIds.length) {
    return new Map<string, QuotationSupplierPriceSnapshot>();
  }

  const supplierPrices = await db.quotationMaterialSupplierPrice.findMany({
    select: {
      currency: true,
      id: true,
      material: {
        select: {
          currentUnitCostCents: true,
          id: true,
          name: true,
          supplier: true,
          unit: true,
        },
      },
      materialId: true,
      supplierName: true,
      supplierSku: true,
      unitCostCents: true,
    },
    where: {
      archivedAt: null,
      id: { in: supplierPriceIds },
      workspaceId,
    },
  });
  const supplierPriceMap = new Map(
    supplierPrices.map((item) => [item.id, item]),
  );
  const missingSupplierPrice = supplierPriceIds.find(
    (id) => !supplierPriceMap.has(id),
  );

  if (missingSupplierPrice) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "One or more selected supplier prices are unavailable.",
    });
  }

  return supplierPriceMap;
}

async function prepareQuotationInput(
  workspaceId: string,
  input: QuotationInput,
) {
  const materialIds = Array.from(
    new Set(
      input.units.flatMap((unit) =>
        unit.materialLines.flatMap((line) =>
          line.materialId?.trim() ? [line.materialId.trim()] : [],
        ),
      ),
    ),
  );
  const supplierPriceIds = Array.from(
    new Set(
      input.units.flatMap((unit) =>
        unit.materialLines.flatMap((line) =>
          line.supplierPriceId?.trim() ? [line.supplierPriceId.trim()] : [],
        ),
      ),
    ),
  );
  const materialMap = await getQuotationMaterialsById(workspaceId, materialIds);
  const supplierPriceMap = await getQuotationSupplierPricesById(
    workspaceId,
    supplierPriceIds,
  );
  const markupBps = markupBpsFromPercent(input.markupPercent);
  let materialSubtotalCents = 0;
  let laborSubtotalCents = 0;

  const units = input.units.map((unit, unitIndex) => {
    const unitQuantity = Math.max(1, unit.quantity);
    const lines = unit.materialLines.map((line, lineIndex) => {
      const selectedSupplierPrice = line.supplierPriceId?.trim()
        ? supplierPriceMap.get(line.supplierPriceId.trim())
        : undefined;
      const selectedMaterial = line.materialId?.trim()
        ? materialMap.get(line.materialId.trim())
        : selectedSupplierPrice?.material;

      if (
        selectedSupplierPrice &&
        selectedMaterial &&
        selectedSupplierPrice.materialId !== selectedMaterial.id
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected supplier price does not match the material line.",
        });
      }

      const materialName =
        optionalValue(line.materialName) ?? selectedMaterial?.name;

      if (!materialName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Each material line needs a selected or custom material.",
        });
      }

      const unitName =
        optionalValue(line.unit) ?? selectedMaterial?.unit ?? "piece";
      const unitCostCents = normalizeCents(
        line.unitCostCents ??
          selectedSupplierPrice?.unitCostCents ??
          selectedMaterial?.currentUnitCostCents,
      );
      const supplierName =
        optionalValue(line.supplierName) ??
        selectedSupplierPrice?.supplierName ??
        selectedMaterial?.supplier ??
        null;
      const totalCents = calculateLineTotalCents(
        line,
        unitQuantity,
        unitCostCents,
      );

      return {
        materialId: selectedMaterial?.id ?? null,
        materialName,
        quantity: line.quantity,
        sortOrder: lineIndex,
        supplierName,
        supplierPriceId: selectedSupplierPrice?.id ?? null,
        supplierSku: selectedSupplierPrice?.supplierSku ?? null,
        totalCents,
        unit: unitName,
        unitCostCents,
        wastePercent: line.wastePercent ?? 0,
      };
    });
    const unitMaterialSubtotalCents = lines.reduce(
      (total, line) => total + line.totalCents,
      0,
    );
    const unitLaborSubtotalCents =
      normalizeCents(unit.laborCostCents) * unitQuantity;
    const unitSubtotalCents =
      unitMaterialSubtotalCents + unitLaborSubtotalCents;
    const unitMarkupCents = calculateMarkup(unitSubtotalCents, markupBps);
    const unitTotalCents = unitSubtotalCents + unitMarkupCents;

    materialSubtotalCents += unitMaterialSubtotalCents;
    laborSubtotalCents += unitLaborSubtotalCents;

    return {
      heightMm: unit.heightMm,
      label: unit.label,
      laborCostCents: normalizeCents(unit.laborCostCents),
      laborSubtotalCents: unitLaborSubtotalCents,
      lines,
      location: optionalValue(unit.location),
      markupCents: unitMarkupCents,
      materialSubtotalCents: unitMaterialSubtotalCents,
      notes: optionalValue(unit.notes),
      quantity: unitQuantity,
      sortOrder: unitIndex,
      subtotalCents: unitSubtotalCents,
      totalCents: unitTotalCents,
      unitType: unit.unitType,
      widthMm: unit.widthMm,
    };
  });
  const subtotalCents = materialSubtotalCents + laborSubtotalCents;
  const markupCents = calculateMarkup(subtotalCents, markupBps);

  return {
    currency: input.currency || "NGN",
    customerId: input.customerId?.trim() || null,
    markupBps,
    markupCents,
    materialSubtotalCents,
    laborSubtotalCents,
    subtotalCents,
    totalCents: subtotalCents + markupCents,
    units,
  };
}

async function assertQuotationCustomer(
  workspaceId: string,
  customerId: string | null,
) {
  if (!customerId) return;

  await db.customer.findFirstOrThrow({
    select: { id: true },
    where: {
      id: customerId,
      workspaceId,
    },
  });
}

async function nextQuotationNumber(workspaceId: string) {
  const year = new Date().getFullYear();
  const prefix = `ANX-Q-${year}-`;
  const count = await db.projectQuotation.count({
    where: {
      quotationNumber: { startsWith: prefix },
      workspaceId,
    },
  });

  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

function quotationMaterialDto(material: {
  archivedAt?: Date | null;
  category?: string | null;
  costHistory?: Array<{
    createdAt: Date;
    effectiveAt: Date;
    id: string;
    note?: string | null;
    supplier?: string | null;
    unitCostCents: number;
  }>;
  supplierPrices?: Array<{
    archivedAt?: Date | null;
    currency: string;
    history?: Array<{
      createdAt: Date;
      effectiveAt: Date;
      id: string;
      note?: string | null;
      previousUnitCostCents?: number | null;
      unitCostCents: number;
    }>;
    id: string;
    isPreferred: boolean;
    leadTimeDays?: number | null;
    materialId: string;
    notes?: string | null;
    supplierName: string;
    supplierSku?: string | null;
    unitCostCents: number;
  }>;
  createdAt: Date;
  currentUnitCostCents: number;
  id: string;
  name: string;
  notes?: string | null;
  supplier?: string | null;
  unit: string;
  updatedAt: Date;
}) {
  return {
    archivedAt: iso(material.archivedAt),
    category: material.category ?? "",
    costHistory:
      material.costHistory?.map((history) => ({
        createdAt: history.createdAt.toISOString(),
        effectiveAt: history.effectiveAt.toISOString(),
        id: history.id,
        note: history.note ?? "",
        supplier: history.supplier ?? "",
        unitCostCents: history.unitCostCents,
      })) ?? [],
    createdAt: material.createdAt.toISOString(),
    currentUnitCostCents: material.currentUnitCostCents,
    id: material.id,
    name: material.name,
    notes: material.notes ?? "",
    supplier: material.supplier ?? "",
    supplierPrices:
      material.supplierPrices?.map((price) => ({
        archivedAt: iso(price.archivedAt),
        currency: price.currency,
        history:
          price.history?.map((history) => ({
            createdAt: history.createdAt.toISOString(),
            effectiveAt: history.effectiveAt.toISOString(),
            id: history.id,
            note: history.note ?? "",
            previousUnitCostCents: history.previousUnitCostCents ?? null,
            unitCostCents: history.unitCostCents,
          })) ?? [],
        id: price.id,
        isPreferred: price.isPreferred,
        leadTimeDays: price.leadTimeDays ?? null,
        materialId: price.materialId,
        notes: price.notes ?? "",
        supplierName: price.supplierName,
        supplierSku: price.supplierSku ?? "",
        unitCostCents: price.unitCostCents,
      })) ?? [],
    unit: material.unit,
    updatedAt: material.updatedAt.toISOString(),
  };
}

function quotationLineDto(line: {
  createdAt: Date;
  id: string;
  material?: { id: string; name: string } | null;
  materialId?: string | null;
  materialName: string;
  quantity: number;
  sortOrder: number;
  supplierName?: string | null;
  supplierPriceId?: string | null;
  supplierSku?: string | null;
  totalCents: number;
  unit: string;
  unitCostCents: number;
  updatedAt: Date;
  wastePercent: number;
}) {
  return {
    createdAt: line.createdAt.toISOString(),
    id: line.id,
    materialId: line.materialId ?? null,
    materialName: line.materialName,
    quantity: line.quantity,
    sortOrder: line.sortOrder,
    supplierName: line.supplierName ?? "",
    supplierPriceId: line.supplierPriceId ?? null,
    supplierSku: line.supplierSku ?? "",
    totalCents: line.totalCents,
    unit: line.unit,
    unitCostCents: line.unitCostCents,
    updatedAt: line.updatedAt.toISOString(),
    wastePercent: line.wastePercent,
  };
}

function quotationUnitDto(unit: {
  createdAt: Date;
  heightMm: number;
  id: string;
  label: string;
  laborCostCents: number;
  laborSubtotalCents: number;
  location?: string | null;
  markupCents: number;
  materialLines?: Array<Parameters<typeof quotationLineDto>[0]>;
  materialSubtotalCents: number;
  notes?: string | null;
  quantity: number;
  sortOrder: number;
  subtotalCents: number;
  totalCents: number;
  unitType: string;
  updatedAt: Date;
  widthMm: number;
}) {
  return {
    areaSqm: (unit.widthMm * unit.heightMm * unit.quantity) / 1_000_000,
    createdAt: unit.createdAt.toISOString(),
    heightMm: unit.heightMm,
    id: unit.id,
    label: unit.label,
    laborCostCents: unit.laborCostCents,
    laborSubtotalCents: unit.laborSubtotalCents,
    location: unit.location ?? "",
    markupCents: unit.markupCents,
    materialLines:
      unit.materialLines?.map((line) => quotationLineDto(line)) ?? [],
    materialSubtotalCents: unit.materialSubtotalCents,
    notes: unit.notes ?? "",
    quantity: unit.quantity,
    sortOrder: unit.sortOrder,
    subtotalCents: unit.subtotalCents,
    totalCents: unit.totalCents,
    unitType: unit.unitType,
    updatedAt: unit.updatedAt.toISOString(),
    widthMm: unit.widthMm,
  };
}

function quotationDto(quotation: {
  clientEmail?: string | null;
  clientName?: string | null;
  createdAt: Date;
  currency: string;
  customer?: { id: string; name: string } | null;
  customerId?: string | null;
  id: string;
  laborSubtotalCents: number;
  markupBps: number;
  markupCents: number;
  materialSubtotalCents: number;
  notes?: string | null;
  projectName: string;
  quotationNumber: string;
  siteAddress?: string | null;
  status: string;
  subtotalCents: number;
  totalCents: number;
  units?: Array<Parameters<typeof quotationUnitDto>[0]>;
  updatedAt: Date;
  validUntil?: Date | null;
}) {
  return {
    clientEmail: quotation.clientEmail ?? "",
    clientName: quotation.clientName ?? "",
    createdAt: quotation.createdAt.toISOString(),
    currency: quotation.currency,
    customer: quotation.customer
      ? {
          id: quotation.customer.id,
          name: quotation.customer.name,
        }
      : null,
    customerId: quotation.customerId ?? null,
    id: quotation.id,
    laborSubtotalCents: quotation.laborSubtotalCents,
    markupBps: quotation.markupBps,
    markupCents: quotation.markupCents,
    markupPercent: percentFromMarkupBps(quotation.markupBps),
    materialSubtotalCents: quotation.materialSubtotalCents,
    notes: quotation.notes ?? "",
    projectName: quotation.projectName,
    quotationNumber: quotation.quotationNumber,
    siteAddress: quotation.siteAddress ?? "",
    status: quotation.status,
    subtotalCents: quotation.subtotalCents,
    totalCents: quotation.totalCents,
    units: quotation.units?.map((unit) => quotationUnitDto(unit)) ?? [],
    updatedAt: quotation.updatedAt.toISOString(),
    validUntil: iso(quotation.validUntil),
  };
}

const customersRouter = t.router({
  archive: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.customer.update({
        data: { archivedAt: new Date() },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: customerDto({ ...item, followUps: [] }) };
    }),
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().trim().optional(),
        email: z.string().trim().email().optional().or(z.literal("")),
        name: z.string().trim().min(1),
        notes: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        tags: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertUnderLimit(ctx.workspace.id, "customers");

      const item = await db.customer.create({
        data: {
          companyName: input.companyName || null,
          email: input.email || null,
          name: input.name,
          notes: input.notes || null,
          phone: input.phone || null,
          tags: input.tags
            ? input.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
          workspaceId: ctx.workspace.id,
        },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.CustomerCreated.name,
        channel: LogEvents.CustomerCreated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      return { item: customerDto({ ...item, followUps: [] }) };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const item = await db.customer.findFirstOrThrow({
        include: {
          followUps: {
            orderBy: { dueAt: "desc" },
            take: 20,
          },
          jobs: {
            orderBy: { completedAt: "desc" },
            take: 20,
          },
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return {
        item: {
          ...customerDto(item),
          followUps: item.followUps.map((followUp) => ({
            dueAt: followUp.dueAt.toISOString(),
            id: followUp.id,
            status: followUp.status,
          })),
          jobs: item.jobs.map((job) => ({
            completedAt: job.completedAt.toISOString(),
            id: job.id,
            title: job.title,
          })),
        },
      };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().default(false),
          search: z.string().trim().optional(),
          sort: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          cursor: z.string().nullish(),
          limit: z.number().min(1).max(100).default(50),
        })
        .default({ includeArchived: false, limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const items = await db.customer.findMany({
        include: {
          followUps: {
            select: { status: true },
          },
        },
        orderBy: resolveSort(input.sort, customerSorts, { updatedAt: "desc" }),
        where: {
          archivedAt: input.includeArchived ? undefined : null,
          ...(input.search
            ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" } },
                  {
                    companyName: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                  { email: { contains: input.search, mode: "insensitive" } },
                  { phone: { contains: input.search, mode: "insensitive" } },
                  { tags: { has: input.search } },
                ],
              }
            : {}),
          ...(input.tags?.length ? { tags: { hasSome: input.tags } } : {}),
          workspaceId: ctx.workspace.id,
        },
      });

      return { items: items.map(customerDto), nextCursor: null };
    }),
  tags: protectedProcedure.query(async ({ ctx }) => {
    const customers = await db.customer.findMany({
      select: { tags: true },
      where: { workspaceId: ctx.workspace.id },
    });
    const tags = new Set<string>();

    for (const customer of customers) {
      for (const tag of customer.tags) {
        const value = tag.trim();

        if (value) {
          tags.add(value);
        }
      }
    }

    return {
      items: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    };
  }),
  update: protectedProcedure
    .input(
      z.object({
        companyName: z.string().trim().optional(),
        email: z.string().trim().email().optional().or(z.literal("")),
        id: z.string().min(1),
        name: z.string().trim().min(1),
        notes: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        tags: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await db.customer.update({
        data: {
          companyName: input.companyName || null,
          email: input.email || null,
          name: input.name,
          notes: input.notes || null,
          phone: input.phone || null,
          tags: input.tags
            ? input.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : [],
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: customerDto({ ...item, followUps: [] }) };
    }),
});

const serviceJobsRouter = t.router({
  create: protectedProcedure
    .input(
      z.object({
        amountCents: z.coerce.number().int().nonnegative().optional(),
        completedAt: z.coerce.date(),
        customerId: z.string().min(1),
        nextFollowUpAt: z.coerce.date().optional(),
        notes: z.string().trim().optional(),
        serviceCategory: z.string().trim().optional(),
        title: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customer = await db.customer.findFirstOrThrow({
        where: { id: input.customerId, workspaceId: ctx.workspace.id },
      });
      const item = await db.serviceJob.create({
        data: {
          amountCents: input.amountCents ?? null,
          completedAt: input.completedAt,
          customerId: customer.id,
          nextFollowUpAt: input.nextFollowUpAt ?? null,
          notes: input.notes || null,
          serviceCategory: input.serviceCategory || null,
          title: input.title,
          workspaceId: ctx.workspace.id,
        },
      });

      await db.customer.update({
        data: { lastServiceAt: input.completedAt },
        where: { id: customer.id },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.ServiceJobCreated.name,
        channel: LogEvents.ServiceJobCreated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      return { item };
    }),
  createFollowUp: protectedProcedure
    .input(
      z.object({
        channel: channelSchema.default("email"),
        dueAt: z.coerce.date().optional(),
        jobId: z.string().min(1),
        notes: z.string().trim().optional(),
        templateId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertUnderLimit(ctx.workspace.id, "followUps");

      const job = await db.serviceJob.findFirstOrThrow({
        include: { workspace: true },
        where: { id: input.jobId, workspaceId: ctx.workspace.id },
      });
      const dueAt =
        input.dueAt ??
        new Date(
          Date.now() + job.workspace.defaultFollowUpDelayDays * 86400000,
        );

      const item = await db.followUp.create({
        data: {
          channel: input.channel,
          customerId: job.customerId,
          dueAt,
          jobId: job.id,
          notes: input.notes || `Follow up about ${job.title}.`,
          status: "scheduled",
          templateId: input.templateId ?? null,
          workspaceId: ctx.workspace.id,
          events: {
            create: {
              actorId: ctx.user?.id,
              type: "created_from_job",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
      });

      await db.serviceJob.update({
        data: { nextFollowUpAt: dueAt, status: "needs_follow_up" },
        where: { id: job.id },
      });

      return { item: followUpDto(item) };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const item = await db.serviceJob.findFirstOrThrow({
        include: { customer: true, followUps: true },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          q: z.string().trim().optional(),
          search: z.string().trim().optional(),
          categories: z.array(z.string()).optional(),
          customers: z.array(z.string()).optional(),
          status: serviceJobStatusSchema.optional(),
          start: z.string().optional(),
          end: z.string().optional(),
          sort: z.array(z.string()).optional(),
          cursor: z.string().nullish(),
          limit: z.number().min(1).max(100).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const searchTerm = input.q ?? input.search;

      const completedAtFilter: Record<string, Date> = {};
      if (input.start) completedAtFilter.gte = new Date(input.start);
      if (input.end) {
        const endDate = new Date(input.end);
        endDate.setHours(23, 59, 59, 999);
        completedAtFilter.lte = endDate;
      }

      const items = await db.serviceJob.findMany({
        include: { customer: true, followUps: true },
        orderBy: resolveSort(input.sort, serviceJobSorts, {
          completedAt: "desc",
        }),
        where: {
          workspaceId: ctx.workspace.id,
          ...(searchTerm
            ? {
                OR: [
                  { title: { contains: searchTerm, mode: "insensitive" } },
                  {
                    customer: {
                      name: { contains: searchTerm, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {}),
          ...(input.customers?.length
            ? { customerId: { in: input.customers } }
            : {}),
          ...(input.categories?.length
            ? { serviceCategory: { in: input.categories } }
            : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(Object.keys(completedAtFilter).length
            ? { completedAt: completedAtFilter }
            : {}),
        },
      });

      return { items, nextCursor: null };
    }),
  markCompleted: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.serviceJob.update({
        data: { completedAt: new Date(), status: "completed" },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.ServiceJobStatusUpdated.name,
        channel: LogEvents.ServiceJobStatusUpdated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      const customer = await db.customer.findUniqueOrThrow({
        where: { id: item.customerId },
      });

      // Async dispatch notification
      notifications
        .send("job_completed_checkin", ctx.workspace.id, {
          users: [
            {
              id: customer.id,
              email: customer.email || "",
              phone: customer.phone || undefined,
              workspace_id: ctx.workspace.id,
            },
          ],
          jobId: item.id,
          customerId: item.customerId,
          completedAt: item.completedAt.toISOString(),
        })
        .catch(console.error);

      return { item };
    }),
  update: protectedProcedure
    .input(
      z.object({
        amountCents: z.coerce.number().int().nonnegative().optional(),
        completedAt: z.coerce.date(),
        id: z.string().min(1),
        nextFollowUpAt: z.coerce.date().optional(),
        notes: z.string().trim().optional(),
        serviceCategory: z.string().trim().optional(),
        status: serviceJobStatusSchema.default("completed"),
        title: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await db.serviceJob.update({
        data: {
          amountCents: input.amountCents ?? null,
          completedAt: input.completedAt,
          nextFollowUpAt: input.nextFollowUpAt ?? null,
          notes: input.notes || null,
          serviceCategory: input.serviceCategory || null,
          status: input.status,
          title: input.title,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item };
    }),
});

const followUpsRouter = t.router({
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const item = await db.followUp.findFirstOrThrow({
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: followUpDto(item) };
    }),
  assignOwner: protectedProcedure
    .input(
      z.object({ assigneeId: z.string().min(1).nullable(), id: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUp.update({
        data: {
          assigneeId: input.assigneeId,
          events: {
            create: {
              actorId: ctx.user?.id,
              metadata: { assigneeId: input.assigneeId },
              type: "assigned",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: followUpDto(item) };
    }),
  close: protectedProcedure
    .input(z.object({ id: z.string().min(1), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUp.update({
        data: {
          closedAt: new Date(),
          notes: input.notes,
          status: "closed",
          events: {
            create: {
              actorId: ctx.user?.id,
              metadata: input.notes ? { notes: input.notes } : undefined,
              type: "closed",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.FollowUpStatusUpdated.name,
        channel: LogEvents.FollowUpStatusUpdated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      return { item: followUpDto(item) };
    }),
  create: protectedProcedure
    .input(
      z.object({
        channel: channelSchema.default("email"),
        customerId: z.string().min(1),
        dueAt: z.coerce.date(),
        jobId: z.string().min(1).optional(),
        notes: z.string().trim().optional(),
        templateId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertUnderLimit(ctx.workspace.id, "followUps");

      await db.customer.findFirstOrThrow({
        where: { id: input.customerId, workspaceId: ctx.workspace.id },
      });

      const item = await db.followUp.create({
        data: {
          channel: input.channel,
          customerId: input.customerId,
          dueAt: input.dueAt,
          jobId: input.jobId ?? null,
          notes: input.notes || null,
          status: "scheduled",
          templateId: input.templateId ?? null,
          workspaceId: ctx.workspace.id,
          events: {
            create: {
              actorId: ctx.user?.id,
              type: "created",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.FollowUpCreated.name,
        channel: LogEvents.FollowUpCreated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      notifications
        .send("followup_scheduled", ctx.workspace.id, {
          users: [
            {
              id: item.customer.id,
              email: item.customer.email || "",
              phone: item.customer.phone || undefined,
              workspace_id: ctx.workspace.id,
            },
          ],
          jobId: item.jobId || undefined,
          customerId: item.customerId,
          dueAt: item.dueAt.toISOString(),
          notes: item.notes || undefined,
          channel: item.channel,
        })
        .catch(console.error);

      return { item: followUpDto(item) };
    }),
  listBoard: protectedProcedure.query(async ({ ctx }) => {
    const items = await db.followUp.findMany({
      include: {
        customer: true,
        events: { orderBy: { createdAt: "desc" }, take: 5 },
        job: true,
        messageLogs: { orderBy: { createdAt: "desc" }, take: 3 },
        template: true,
      },
      orderBy: { dueAt: "asc" },
      where: { workspaceId: ctx.workspace.id },
    });
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const serialized = items.map(followUpDto);

    return {
      columns: {
        closed: serialized.filter((item) => item.status === "closed"),
        dueToday: serialized.filter(
          (item) =>
            item.status !== "closed" &&
            item.status !== "replied" &&
            new Date(item.dueAt) <= todayEnd,
        ),
        replied: serialized.filter((item) => item.status === "replied"),
        upcoming: serialized.filter(
          (item) =>
            item.status === "scheduled" && new Date(item.dueAt) > todayEnd,
        ),
        waiting: serialized.filter(
          (item) => item.status === "sent" || item.status === "open",
        ),
      },
    };
  }),
  listTable: protectedProcedure
    .input(
      z
        .object({
          channel: channelSchema.optional(),
          end: z.string().optional(),
          status: followUpStatusSchema.optional(),
          search: z.string().trim().optional(),
          sort: z.array(z.string()).optional(),
          start: z.string().optional(),
          cursor: z.string().nullish(),
          limit: z.number().min(1).max(100).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const dueAtFilter: Record<string, Date> = {};
      if (input.start) dueAtFilter.gte = new Date(input.start);
      if (input.end) {
        const endDate = new Date(input.end);
        endDate.setHours(23, 59, 59, 999);
        dueAtFilter.lte = endDate;
      }

      const items = await db.followUp.findMany({
        include: {
          customer: true,
          events: { orderBy: { createdAt: "desc" }, take: 5 },
          job: true,
          messageLogs: { orderBy: { createdAt: "desc" }, take: 3 },
          template: true,
        },
        orderBy: resolveSort(input.sort, followUpSorts, { dueAt: "asc" }),
        where: {
          channel: input.channel,
          ...(Object.keys(dueAtFilter).length ? { dueAt: dueAtFilter } : {}),
          status: input.status,
          workspaceId: ctx.workspace.id,
          customer: input.search
            ? { name: { contains: input.search, mode: "insensitive" } }
            : undefined,
        },
      });

      return { items: items.map(followUpDto), nextCursor: null };
    }),
  markReplied: protectedProcedure
    .input(z.object({ id: z.string().min(1), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUp.update({
        data: {
          notes: input.notes,
          status: "replied",
          events: {
            create: {
              actorId: ctx.user?.id,
              metadata: input.notes ? { notes: input.notes } : undefined,
              type: "replied",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.FollowUpStatusUpdated.name,
        channel: LogEvents.FollowUpStatusUpdated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      return { item: followUpDto(item) };
    }),
  markSent: protectedProcedure
    .input(
      z.object({
        body: z.string().trim().min(1),
        id: z.string().min(1),
        recipient: z.string().trim().min(1),
        subject: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const followUp = await db.followUp.findFirstOrThrow({
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });
      const item = await db.followUp.update({
        data: {
          sentAt: new Date(),
          status: "sent",
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      const analytics = await setupAnalytics();
      analytics.track({
        event: LogEvents.MessageSent.name,
        channel: LogEvents.MessageSent.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      const notificationPayload = {
        users: [
          {
            id: item.customer.id,
            email: item.customer.email || "",
            phone: item.customer.phone || undefined,
            workspace_id: ctx.workspace.id,
          },
        ],
        followUpId: item.id,
        customerId: item.customerId,
        body: input.body,
        channel: followUp.channel,
        recipient: input.recipient,
      };

      if (followUp.channel === "email") {
        await tasks.trigger("notification", {
          channels: ["email"],
          payload: notificationPayload,
          sendEmail: true,
          type: "followup_message_sent",
          workspaceId: ctx.workspace.id,
        });
      } else {
        await notifications.send(
          "followup_message_sent",
          ctx.workspace.id,
          notificationPayload,
          { channels: [followUp.channel] },
        );
      }

      analytics.track({
        event: LogEvents.FollowUpStatusUpdated.name,
        channel: LogEvents.FollowUpStatusUpdated.channel,
        profileId: ctx.user?.id,
        workspaceId: ctx.workspace.id,
      });

      const updatedItem = await db.followUp.findFirstOrThrow({
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: followUpDto(updatedItem) };
    }),
  reschedule: protectedProcedure
    .input(z.object({ dueAt: z.coerce.date(), id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUp.update({
        data: {
          dueAt: input.dueAt,
          status: "scheduled",
          events: {
            create: {
              actorId: ctx.user?.id,
              metadata: { dueAt: input.dueAt.toISOString() },
              type: "rescheduled",
              workspaceId: ctx.workspace.id,
            },
          },
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: followUpDto(item) };
    }),
  update: protectedProcedure
    .input(
      z.object({
        channel: channelSchema,
        dueAt: z.coerce.date(),
        id: z.string().min(1),
        notes: z.string().trim().optional(),
        status: followUpStatusSchema,
        templateId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUp.update({
        data: {
          channel: input.channel,
          dueAt: input.dueAt,
          notes: input.notes || null,
          status: input.status,
          templateId: input.templateId ?? null,
        },
        include: {
          customer: true,
          events: true,
          job: true,
          messageLogs: true,
          template: true,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item: followUpDto(item) };
    }),
});

const templatesRouter = t.router({
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const item = await db.followUpTemplate.findFirstOrThrow({
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });
      return { item };
    }),
  archive: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db.followUpTemplate.delete({
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });
      return { item: { id: input.id } };
    }),
  create: protectedProcedure
    .input(
      z.object({
        body: z.string().trim().min(1),
        channel: channelSchema.default("email"),
        isDefault: z.boolean().default(false),
        name: z.string().trim().min(1),
        subject: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertUnderLimit(ctx.workspace.id, "templates");
      const item = await db.followUpTemplate.create({
        data: { ...input, workspaceId: ctx.workspace.id },
      });
      return { item };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          channel: channelSchema.optional(),
          search: z.string().trim().optional(),
          sort: z.array(z.string()).optional(),
          cursor: z.string().nullish(),
          limit: z.number().min(1).max(100).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      const items = await db.followUpTemplate.findMany({
        orderBy: resolveSort(input.sort, templateSorts, [
          { sortOrder: "asc" },
          { name: "asc" },
        ]),
        where: {
          channel: input.channel,
          workspaceId: ctx.workspace.id,
          name: input.search
            ? { contains: input.search, mode: "insensitive" }
            : undefined,
        },
      });

      const workspaceInfo = await db.workspace.findUnique({
        where: { id: ctx.workspace.id },
        select: { name: true },
      });

      const sampleJob = await db.serviceJob.findFirst({
        where: { workspaceId: ctx.workspace.id },
        orderBy: { completedAt: "desc" },
      });

      const sampleCustomer = sampleJob
        ? await db.customer.findUnique({
            where: { id: sampleJob.customerId },
          })
        : await db.customer.findFirst({
            where: { workspaceId: ctx.workspace.id },
          });

      return {
        items,
        nextCursor: null,
        workspace: workspaceInfo,
        sampleJob,
        sampleCustomer,
      };
    }),
  setDefault: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const template = await db.followUpTemplate.findFirstOrThrow({
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });
      await db.followUpTemplate.updateMany({
        data: { isDefault: false },
        where: { channel: template.channel, workspaceId: ctx.workspace.id },
      });
      const item = await db.followUpTemplate.update({
        data: { isDefault: true },
        where: { id: input.id },
      });

      return { item };
    }),
  update: protectedProcedure
    .input(
      z.object({
        body: z.string().trim().min(1),
        channel: channelSchema,
        id: z.string().min(1),
        isDefault: z.boolean().default(false),
        name: z.string().trim().min(1),
        subject: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await db.followUpTemplate.update({
        data: {
          body: input.body,
          channel: input.channel,
          isDefault: input.isDefault,
          name: input.name,
          subject: input.subject || null,
        },
        where: { id: input.id, workspaceId: ctx.workspace.id },
      });

      return { item };
    }),
});

const workspaceRouter = t.router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const workspace = await getWorkspaceForLimits(ctx.workspace.id);
    const usage = {
      customers: await db.customer.count({
        where: { archivedAt: null, workspaceId: ctx.workspace.id },
      }),
      followUps: await db.followUp.count({
        where: { workspaceId: ctx.workspace.id },
      }),
      teamMembers: await db.membership.count({
        where: { workspaceId: ctx.workspace.id },
      }),
      templates: await db.followUpTemplate.count({
        where: { workspaceId: ctx.workspace.id },
      }),
    };

    return { item: { ...workspace, usage } };
  }),
  updateSettings: protectedProcedure
    .input(
      z.object({
        businessType: z.string().trim().optional(),
        defaultFollowUpDelayDays: z.coerce.number().int().min(1).max(365),
        name: z.string().trim().min(1),
        serviceCategory: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);
      const item = await db.workspace.update({
        data: {
          businessType: input.businessType || null,
          defaultFollowUpDelayDays: input.defaultFollowUpDelayDays,
          name: input.name,
          serviceCategory: input.serviceCategory || null,
        },
        where: { id: ctx.workspace.id },
      });

      return { item };
  }),
});

const quotationMaterialCostHistoryOrderBy: Prisma.QuotationMaterialCostHistoryOrderByWithRelationInput =
  { effectiveAt: "desc" };
const quotationMaterialSupplierPriceHistoryOrderBy: Prisma.QuotationMaterialSupplierPriceHistoryOrderByWithRelationInput =
  { effectiveAt: "desc" };
const quotationMaterialSupplierPriceOrderBy: Prisma.QuotationMaterialSupplierPriceOrderByWithRelationInput[] =
  [
    { isPreferred: "desc" },
    { supplierName: "asc" },
    { createdAt: "desc" },
  ];

function quotationMaterialInclude(includeArchivedSupplierPrices = false) {
  return {
    costHistory: {
      orderBy: quotationMaterialCostHistoryOrderBy,
      take: 5,
    },
    supplierPrices: {
      include: {
        history: {
          orderBy: quotationMaterialSupplierPriceHistoryOrderBy,
          take: 5,
        },
      },
      orderBy: quotationMaterialSupplierPriceOrderBy,
      where: includeArchivedSupplierPrices ? undefined : { archivedAt: null },
    },
  };
}

async function syncPreferredSupplierPrice(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  supplierPrice: {
    id: string;
    materialId: string;
    supplierName: string;
    unitCostCents: number;
  },
  note: string | null,
  effectiveAt?: Date,
) {
  await tx.quotationMaterial.update({
    data: {
      currentUnitCostCents: supplierPrice.unitCostCents,
      supplier: supplierPrice.supplierName,
    },
    where: {
      id: supplierPrice.materialId,
      workspaceId,
    },
  });

  await tx.quotationMaterialCostHistory.create({
    data: {
      effectiveAt: effectiveAt ?? new Date(),
      materialId: supplierPrice.materialId,
      note,
      supplier: supplierPrice.supplierName,
      unitCostCents: supplierPrice.unitCostCents,
      workspaceId,
    },
  });
}

const quotationMaterialSupplierPricesRouter = t.router({
  archive: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const existing = await db.quotationMaterialSupplierPrice.findFirstOrThrow({
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
      });

      const item = await db.quotationMaterialSupplierPrice.update({
        data: {
          archivedAt: new Date(),
          isPreferred: false,
        },
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
      });

      return { item, materialId: existing.materialId };
    }),
  create: protectedProcedure
    .input(createQuotationMaterialSupplierPriceSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const unitCostCents = normalizeCents(input.unitCostCents);
      const item = await db.$transaction(async (tx) => {
        const material = await tx.quotationMaterial.findFirstOrThrow({
          select: { id: true },
          where: {
            id: input.materialId,
            workspaceId: ctx.workspace.id,
          },
        });

        if (input.isPreferred) {
          await tx.quotationMaterialSupplierPrice.updateMany({
            data: { isPreferred: false },
            where: {
              archivedAt: null,
              materialId: material.id,
              workspaceId: ctx.workspace.id,
            },
          });
        }

        const supplierPrice = await tx.quotationMaterialSupplierPrice.create({
          data: {
            currency: input.currency || "NGN",
            isPreferred: input.isPreferred,
            leadTimeDays: input.leadTimeDays ?? null,
            materialId: material.id,
            notes: optionalValue(input.notes),
            supplierName: input.supplierName,
            supplierSku: optionalValue(input.supplierSku),
            unitCostCents,
            workspaceId: ctx.workspace.id,
          },
        });

        await tx.quotationMaterialSupplierPriceHistory.create({
          data: {
            currency: supplierPrice.currency,
            effectiveAt: input.effectiveAt ?? new Date(),
            materialId: material.id,
            note: optionalValue(input.note) ?? "Initial supplier price",
            supplierName: supplierPrice.supplierName,
            supplierPriceId: supplierPrice.id,
            supplierSku: supplierPrice.supplierSku,
            unitCostCents,
            workspaceId: ctx.workspace.id,
          },
        });

        if (supplierPrice.isPreferred) {
          await syncPreferredSupplierPrice(
            tx,
            ctx.workspace.id,
            supplierPrice,
            optionalValue(input.note) ?? "Preferred supplier price set",
            input.effectiveAt,
          );
        }

        return tx.quotationMaterial.findUniqueOrThrow({
          include: quotationMaterialInclude(),
          where: { id: material.id },
        });
      });

      return { item: quotationMaterialDto(item) };
    }),
  update: protectedProcedure
    .input(updateQuotationMaterialSupplierPriceSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const unitCostCents = normalizeCents(input.unitCostCents);
      const item = await db.$transaction(async (tx) => {
        const existing = await tx.quotationMaterialSupplierPrice.findFirstOrThrow({
          where: {
            id: input.id,
            materialId: input.materialId,
            workspaceId: ctx.workspace.id,
          },
        });

        if (input.isPreferred) {
          await tx.quotationMaterialSupplierPrice.updateMany({
            data: { isPreferred: false },
            where: {
              archivedAt: null,
              id: { not: input.id },
              materialId: input.materialId,
              workspaceId: ctx.workspace.id,
            },
          });
        }

        const supplierPrice = await tx.quotationMaterialSupplierPrice.update({
          data: {
            currency: input.currency || existing.currency,
            isPreferred: input.isPreferred,
            leadTimeDays: input.leadTimeDays ?? null,
            notes: optionalValue(input.notes),
            supplierName: input.supplierName,
            supplierSku: optionalValue(input.supplierSku),
            unitCostCents,
          },
          where: {
            id: input.id,
            workspaceId: ctx.workspace.id,
          },
        });

        if (
          existing.unitCostCents !== unitCostCents ||
          existing.supplierName !== supplierPrice.supplierName ||
          existing.supplierSku !== supplierPrice.supplierSku
        ) {
          await tx.quotationMaterialSupplierPriceHistory.create({
            data: {
              currency: supplierPrice.currency,
              effectiveAt: input.effectiveAt ?? new Date(),
              materialId: supplierPrice.materialId,
              note: optionalValue(input.note) ?? "Supplier price updated",
              previousUnitCostCents: existing.unitCostCents,
              supplierName: supplierPrice.supplierName,
              supplierPriceId: supplierPrice.id,
              supplierSku: supplierPrice.supplierSku,
              unitCostCents,
              workspaceId: ctx.workspace.id,
            },
          });
        }

        if (supplierPrice.isPreferred) {
          await syncPreferredSupplierPrice(
            tx,
            ctx.workspace.id,
            supplierPrice,
            optionalValue(input.note) ?? "Preferred supplier price updated",
            input.effectiveAt,
          );
        }

        return tx.quotationMaterial.findUniqueOrThrow({
          include: quotationMaterialInclude(),
          where: { id: supplierPrice.materialId },
        });
      });

      return { item: quotationMaterialDto(item) };
    }),
});

const quotationMaterialsRouter = t.router({
  archive: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const item = await db.quotationMaterial.update({
        data: { archivedAt: new Date() },
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
        include: quotationMaterialInclude(true),
      });

      return { item: quotationMaterialDto(item) };
    }),
  create: protectedProcedure
    .input(createQuotationMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const item = await db.$transaction(async (tx) => {
        const material = await tx.quotationMaterial.create({
          data: {
            category: optionalValue(input.category),
            currentUnitCostCents: normalizeCents(input.currentUnitCostCents),
            name: input.name,
            notes: optionalValue(input.notes),
            supplier: optionalValue(input.supplier),
            unit: input.unit,
            workspaceId: ctx.workspace.id,
          },
        });

        await tx.quotationMaterialCostHistory.create({
          data: {
            materialId: material.id,
            note: "Initial material cost",
            supplier: optionalValue(input.supplier),
            unitCostCents: material.currentUnitCostCents,
            workspaceId: ctx.workspace.id,
          },
        });

        if (input.supplier) {
          const supplierPrice = await tx.quotationMaterialSupplierPrice.create({
            data: {
              isPreferred: true,
              materialId: material.id,
              supplierName: input.supplier,
              unitCostCents: material.currentUnitCostCents,
              workspaceId: ctx.workspace.id,
            },
          });

          await tx.quotationMaterialSupplierPriceHistory.create({
            data: {
              materialId: material.id,
              note: "Initial supplier material price",
              supplierName: input.supplier,
              supplierPriceId: supplierPrice.id,
              unitCostCents: material.currentUnitCostCents,
              workspaceId: ctx.workspace.id,
            },
          });
        }

        return tx.quotationMaterial.findUniqueOrThrow({
          where: { id: material.id },
          include: quotationMaterialInclude(),
        });
      });

      return { item: quotationMaterialDto(item) };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().default(false),
          q: z.string().trim().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const q = input?.q?.trim();
      const items = await db.quotationMaterial.findMany({
        include: quotationMaterialInclude(input?.includeArchived),
        orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
        where: {
          archivedAt: input?.includeArchived ? undefined : null,
          workspaceId: ctx.workspace.id,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { category: { contains: q, mode: "insensitive" } },
                  { supplier: { contains: q, mode: "insensitive" } },
                  {
                    supplierPrices: {
                      some: {
                        supplierName: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      });

      return { items: items.map((item) => quotationMaterialDto(item)) };
    }),
  update: protectedProcedure
    .input(updateQuotationMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const existing = await db.quotationMaterial.findFirstOrThrow({
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
      });
      const nextCostCents = normalizeCents(input.currentUnitCostCents);
      const item = await db.$transaction(async (tx) => {
        const material = await tx.quotationMaterial.update({
          data: {
            category: optionalValue(input.category),
            currentUnitCostCents: nextCostCents,
            name: input.name,
            notes: optionalValue(input.notes),
            supplier: optionalValue(input.supplier),
            unit: input.unit,
          },
          where: {
            id: input.id,
            workspaceId: ctx.workspace.id,
          },
        });

        if (existing.currentUnitCostCents !== nextCostCents) {
          await tx.quotationMaterialCostHistory.create({
            data: {
              materialId: material.id,
              note: "Material cost updated",
              supplier: optionalValue(input.supplier),
              unitCostCents: nextCostCents,
              workspaceId: ctx.workspace.id,
            },
          });
        }

        return tx.quotationMaterial.findUniqueOrThrow({
          where: { id: material.id },
          include: quotationMaterialInclude(),
        });
      });

      return { item: quotationMaterialDto(item) };
    }),
  updateCost: protectedProcedure
    .input(updateQuotationMaterialCostSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const unitCostCents = normalizeCents(input.unitCostCents);
      const item = await db.$transaction(async (tx) => {
        const material = await tx.quotationMaterial.update({
          data: {
            currentUnitCostCents: unitCostCents,
            supplier: optionalValue(input.supplier),
          },
          where: {
            id: input.materialId,
            workspaceId: ctx.workspace.id,
          },
        });

        await tx.quotationMaterialCostHistory.create({
          data: {
            effectiveAt: input.effectiveAt ?? new Date(),
            materialId: material.id,
            note: optionalValue(input.note),
            supplier: optionalValue(input.supplier),
            unitCostCents,
            workspaceId: ctx.workspace.id,
          },
        });

        return tx.quotationMaterial.findUniqueOrThrow({
          where: { id: material.id },
          include: quotationMaterialInclude(),
        });
      });

      return { item: quotationMaterialDto(item) };
    }),
  supplierPrices: quotationMaterialSupplierPricesRouter,
});

const quotationsRouter = t.router({
  create: protectedProcedure
    .input(createProjectQuotationSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const prepared = await prepareQuotationInput(ctx.workspace.id, input);
      await assertQuotationCustomer(ctx.workspace.id, prepared.customerId);

      const item = await db.$transaction(async (tx) => {
        const quotation = await tx.projectQuotation.create({
          data: {
            clientEmail: optionalValue(input.clientEmail),
            clientName: optionalValue(input.clientName),
            currency: prepared.currency,
            customerId: prepared.customerId,
            laborSubtotalCents: prepared.laborSubtotalCents,
            markupBps: prepared.markupBps,
            markupCents: prepared.markupCents,
            materialSubtotalCents: prepared.materialSubtotalCents,
            notes: optionalValue(input.notes),
            projectName: input.projectName,
            quotationNumber: await nextQuotationNumber(ctx.workspace.id),
            siteAddress: optionalValue(input.siteAddress),
            status: input.status,
            subtotalCents: prepared.subtotalCents,
            totalCents: prepared.totalCents,
            validUntil: input.validUntil ?? null,
            workspaceId: ctx.workspace.id,
          },
        });

        for (const unit of prepared.units) {
          const createdUnit = await tx.projectQuotationUnit.create({
            data: {
              heightMm: unit.heightMm,
              label: unit.label,
              laborCostCents: unit.laborCostCents,
              laborSubtotalCents: unit.laborSubtotalCents,
              location: unit.location,
              markupCents: unit.markupCents,
              materialSubtotalCents: unit.materialSubtotalCents,
              notes: unit.notes,
              quantity: unit.quantity,
              quotationId: quotation.id,
              sortOrder: unit.sortOrder,
              subtotalCents: unit.subtotalCents,
              totalCents: unit.totalCents,
              unitType: unit.unitType,
              widthMm: unit.widthMm,
              workspaceId: ctx.workspace.id,
            },
          });

          await tx.projectQuotationMaterialLine.createMany({
            data: unit.lines.map((line) => ({
              materialId: line.materialId,
              materialName: line.materialName,
              quantity: line.quantity,
              quotationId: quotation.id,
              sortOrder: line.sortOrder,
              supplierName: line.supplierName,
              supplierPriceId: line.supplierPriceId,
              supplierSku: line.supplierSku,
              totalCents: line.totalCents,
              unit: line.unit,
              unitCostCents: line.unitCostCents,
              unitId: createdUnit.id,
              wastePercent: line.wastePercent,
              workspaceId: ctx.workspace.id,
            })),
          });
        }

        return tx.projectQuotation.findUniqueOrThrow({
          where: { id: quotation.id },
          include: {
            customer: { select: { id: true, name: true } },
            units: {
              orderBy: { sortOrder: "asc" },
              include: {
                materialLines: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        });
      });

      return { item: quotationDto(item) };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      await db.projectQuotation.delete({
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
      });

      return { id: input.id };
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const item = await db.projectQuotation.findFirstOrThrow({
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
        include: {
          customer: { select: { id: true, name: true } },
          units: {
            orderBy: { sortOrder: "asc" },
            include: {
              materialLines: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      return { item: quotationDto(item) };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
          limit: z.coerce.number().int().min(1).max(100).default(50),
          q: z.string().trim().optional(),
          status: projectQuotationStatusSchema.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const limit = input?.limit ?? 50;
      const q = input?.q?.trim();
      const items = await db.projectQuotation.findMany({
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        include: {
          customer: { select: { id: true, name: true } },
          units: {
            orderBy: { sortOrder: "asc" },
            include: {
              materialLines: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: input?.cursor ? 1 : 0,
        take: limit + 1,
        where: {
          status: input?.status,
          workspaceId: ctx.workspace.id,
          ...(q
            ? {
                OR: [
                  { quotationNumber: { contains: q, mode: "insensitive" } },
                  { projectName: { contains: q, mode: "insensitive" } },
                  { clientName: { contains: q, mode: "insensitive" } },
                  { siteAddress: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      });
      const nextItem = items.length > limit ? items.pop() : null;

      return {
        items: items.map((item) => quotationDto(item)),
        nextCursor: nextItem?.id ?? null,
      };
    }),
  materials: quotationMaterialsRouter,
  update: protectedProcedure
    .input(updateProjectQuotationSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const prepared = await prepareQuotationInput(ctx.workspace.id, input);
      await assertQuotationCustomer(ctx.workspace.id, prepared.customerId);
      await db.projectQuotation.findFirstOrThrow({
        select: { id: true },
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
      });

      const item = await db.$transaction(async (tx) => {
        await tx.projectQuotationMaterialLine.deleteMany({
          where: {
            quotationId: input.id,
            workspaceId: ctx.workspace.id,
          },
        });
        await tx.projectQuotationUnit.deleteMany({
          where: {
            quotationId: input.id,
            workspaceId: ctx.workspace.id,
          },
        });

        const quotation = await tx.projectQuotation.update({
          data: {
            clientEmail: optionalValue(input.clientEmail),
            clientName: optionalValue(input.clientName),
            currency: prepared.currency,
            customerId: prepared.customerId,
            laborSubtotalCents: prepared.laborSubtotalCents,
            markupBps: prepared.markupBps,
            markupCents: prepared.markupCents,
            materialSubtotalCents: prepared.materialSubtotalCents,
            notes: optionalValue(input.notes),
            projectName: input.projectName,
            siteAddress: optionalValue(input.siteAddress),
            status: input.status,
            subtotalCents: prepared.subtotalCents,
            totalCents: prepared.totalCents,
            validUntil: input.validUntil ?? null,
          },
          where: {
            id: input.id,
            workspaceId: ctx.workspace.id,
          },
        });

        for (const unit of prepared.units) {
          const createdUnit = await tx.projectQuotationUnit.create({
            data: {
              heightMm: unit.heightMm,
              label: unit.label,
              laborCostCents: unit.laborCostCents,
              laborSubtotalCents: unit.laborSubtotalCents,
              location: unit.location,
              markupCents: unit.markupCents,
              materialSubtotalCents: unit.materialSubtotalCents,
              notes: unit.notes,
              quantity: unit.quantity,
              quotationId: quotation.id,
              sortOrder: unit.sortOrder,
              subtotalCents: unit.subtotalCents,
              totalCents: unit.totalCents,
              unitType: unit.unitType,
              widthMm: unit.widthMm,
              workspaceId: ctx.workspace.id,
            },
          });

          await tx.projectQuotationMaterialLine.createMany({
            data: unit.lines.map((line) => ({
              materialId: line.materialId,
              materialName: line.materialName,
              quantity: line.quantity,
              quotationId: quotation.id,
              sortOrder: line.sortOrder,
              supplierName: line.supplierName,
              supplierPriceId: line.supplierPriceId,
              supplierSku: line.supplierSku,
              totalCents: line.totalCents,
              unit: line.unit,
              unitCostCents: line.unitCostCents,
              unitId: createdUnit.id,
              wastePercent: line.wastePercent,
              workspaceId: ctx.workspace.id,
            })),
          });
        }

        return tx.projectQuotation.findUniqueOrThrow({
          where: { id: quotation.id },
          include: {
            customer: { select: { id: true, name: true } },
            units: {
              orderBy: { sortOrder: "asc" },
              include: {
                materialLines: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        });
      });

      return { item: quotationDto(item) };
    }),
  updateStatus: protectedProcedure
    .input(updateProjectQuotationStatusSchema)
    .mutation(async ({ ctx, input }) => {
      requireOwnerOrAdmin(ctx);

      const item = await db.projectQuotation.update({
        data: { status: input.status },
        where: {
          id: input.id,
          workspaceId: ctx.workspace.id,
        },
        include: {
          customer: { select: { id: true, name: true } },
          units: {
            orderBy: { sortOrder: "asc" },
            include: {
              materialLines: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      return { item: quotationDto(item) };
    }),
});

const websiteRouter = t.router({
  getLanding: t.procedure.query(() =>
    withWebsiteReadFallback(
      "getLanding",
      async () => {
        const settings = await db.websiteSettings.findFirst({
          orderBy: { updatedAt: "desc" },
        });
        const workspaceId = settings?.workspaceId;

        if (!workspaceId || !settings) {
          return fallbackLandingContent();
        }

        const now = new Date();
        const [gallery, projects, blogPosts] = await Promise.all([
          db.websiteGalleryItem.findMany({
            include: { project: { select: { slug: true, title: true } } },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            where: { isFeatured: true, workspaceId },
          }),
          db.websiteProject.findMany({
            include: { media: { orderBy: { sortOrder: "asc" } } },
            orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
            where: {
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
              workspaceId,
            },
          }),
          db.blogPost.findMany({
            orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
            take: 3,
            where: {
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
              workspaceId,
            },
          }),
        ]);

        return {
          item: {
            blogPosts: blogPosts.length
              ? blogPosts.map(blogPostDto)
              : fallbackBlogPosts,
            gallery: gallery.length
              ? gallery.map(galleryItemDto)
              : fallbackGallery,
            projects: projects.length
              ? projects.map(projectDto)
              : fallbackProjects,
            settings: websiteSettingsDto(settings),
          },
        };
      },
      fallbackLandingContent,
    ),
  ),
  getProject: t.procedure
    .input(z.object({ slug: z.string().trim().min(1) }))
    .query(({ input }) =>
      withWebsiteReadFallback(
        "getProject",
        async () => {
          const now = new Date();
          const item = await db.websiteProject.findFirst({
            include: { media: { orderBy: { sortOrder: "asc" } } },
            where: {
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
              slug: input.slug,
            },
          });

          const fallback = fallbackProjects.find(
            (project) => project.slug === input.slug,
          );

          return {
            item: item ? projectDto(item) : (fallback ?? null),
          };
        },
        () => ({
          item:
            fallbackProjects.find((project) => project.slug === input.slug) ??
            null,
        }),
      ),
    ),
  getBlogPost: t.procedure
    .input(z.object({ slug: z.string().trim().min(1) }))
    .query(({ input }) =>
      withWebsiteReadFallback(
        "getBlogPost",
        async () => {
          const now = new Date();
          const item = await db.blogPost.findFirst({
            where: {
              OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
              slug: input.slug,
            },
          });

          const fallback = fallbackBlogPosts.find(
            (post) => post.slug === input.slug,
          );

          return {
            item: item ? blogPostDto(item) : (fallback ?? null),
          };
        },
        () => ({
          item:
            fallbackBlogPosts.find((post) => post.slug === input.slug) ?? null,
        }),
      ),
    ),
  submitContact: t.procedure
    .input(contactInquirySchema)
    .mutation(async ({ input }) => {
      try {
        const settings = await db.websiteSettings.findFirst({
          orderBy: { updatedAt: "desc" },
        });
        const fallbackWorkspace = settings
          ? null
          : await db.workspace.findFirst({
              orderBy: { createdAt: "asc" },
              select: { id: true },
            });
        const workspaceId =
          settings?.workspaceId ?? fallbackWorkspace?.id ?? null;
        const adminEmail =
          settings?.email ??
          process.env.ANODIZEX_CONTACT_EMAIL ??
          process.env.EMAIL_FROM_ADDRESS ??
          anodizexFallbackSettings.email;

        const created = await db.contactInquiry.create({
          data: {
            companyName: optionalValue(input.companyName),
            email: input.email,
            message: input.message,
            name: input.name,
            phone: optionalValue(input.phone),
            projectType: optionalValue(input.projectType),
            workspaceId,
          },
        });

        const adminResult = await emailService.send({
          data: { body: contactAdminBody(input), inquiryId: created.id },
          subject: `New Anodizex enquiry from ${input.name}`,
          user: {
            email: adminEmail,
            id: `admin-${created.id}`,
            workspace_id: workspaceId ?? "public",
          },
        });
        const customerResult = await emailService.send({
          data: { body: contactCustomerBody(input), inquiryId: created.id },
          subject: "We received your Anodizex enquiry",
          user: {
            email: input.email,
            id: `customer-${created.id}`,
            workspace_id: workspaceId ?? "public",
          },
        });

        const item = await db.contactInquiry.update({
          data: {
            adminEmailStatus: adminResult.status,
            customerEmailStatus: customerResult.status,
            metadata: {
              adminRecipients: adminResult.recipients,
              customerRecipients: customerResult.recipients,
              emailRecipientOverride:
                adminResult.wasRecipientOverridden ||
                customerResult.wasRecipientOverridden,
            },
          },
          where: { id: created.id },
        });

        return { item: inquiryDto(item) };
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "We could not save your enquiry right now. Please try again shortly or contact us directly.",
            cause: error,
          });
        }

        throw error;
      }
    }),
  admin: t.router({
    getContent: protectedProcedure.query(async ({ ctx }) => {
      requireOwnerOrAdmin(ctx);
      const settings = await getOrCreateWebsiteSettings(ctx.workspace.id);
      const [gallery, projects, blogPosts, inquiries] = await Promise.all([
        db.websiteGalleryItem.findMany({
          include: { project: { select: { slug: true, title: true } } },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
          where: { workspaceId: ctx.workspace.id },
        }),
        db.websiteProject.findMany({
          include: { media: { orderBy: { sortOrder: "asc" } } },
          orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
          where: { workspaceId: ctx.workspace.id },
        }),
        db.blogPost.findMany({
          orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
          where: { workspaceId: ctx.workspace.id },
        }),
        db.contactInquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          where: { workspaceId: ctx.workspace.id },
        }),
      ]);

      return {
        item: {
          blogPosts: blogPosts.map(blogPostDto),
          gallery: gallery.map(galleryItemDto),
          inquiries: inquiries.map(inquiryDto),
          projects: projects.map(projectDto),
          settings: websiteSettingsDto(settings),
        },
      };
    }),
    updateSettings: protectedProcedure
      .input(websiteSettingsSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const item = await db.websiteSettings.upsert({
          create: {
            addressLine1: input.addressLine1,
            addressLine2: optionalValue(input.addressLine2),
            city: optionalValue(input.city),
            companyName: input.companyName,
            country: input.country,
            description: input.description,
            email: input.email,
            headline: input.headline,
            heroImageUrl: optionalValue(input.heroImageUrl),
            instagramUrl: optionalValue(input.instagramUrl),
            linkedinUrl: optionalValue(input.linkedinUrl),
            mapUrl: optionalValue(input.mapUrl),
            officeHours: input.officeHours,
            phone: input.phone,
            region: optionalValue(input.region),
            whatsappUrl: optionalValue(input.whatsappUrl),
            workspaceId: ctx.workspace.id,
          },
          update: {
            addressLine1: input.addressLine1,
            addressLine2: optionalValue(input.addressLine2),
            city: optionalValue(input.city),
            companyName: input.companyName,
            country: input.country,
            description: input.description,
            email: input.email,
            headline: input.headline,
            heroImageUrl: optionalValue(input.heroImageUrl),
            instagramUrl: optionalValue(input.instagramUrl),
            linkedinUrl: optionalValue(input.linkedinUrl),
            mapUrl: optionalValue(input.mapUrl),
            officeHours: input.officeHours,
            phone: input.phone,
            region: optionalValue(input.region),
            whatsappUrl: optionalValue(input.whatsappUrl),
          },
          where: { workspaceId: ctx.workspace.id },
        });

        return { item: websiteSettingsDto(item) };
      }),
    createGalleryItem: protectedProcedure
      .input(createGalleryItemSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const sortOrder = await db.websiteGalleryItem.count({
          where: { workspaceId: ctx.workspace.id },
        });
        const projectId = optionalValue(input.projectId);

        if (projectId) {
          await db.websiteProject.findFirstOrThrow({
            where: { id: projectId, workspaceId: ctx.workspace.id },
          });
        }

        const item = await db.websiteGalleryItem.create({
          data: {
            alt: optionalValue(input.alt),
            capturedAt: optionalDateValue(input.capturedAt),
            dateSource: optionalValue(input.capturedAt) ? "manual" : null,
            description: optionalValue(input.description),
            isFeatured: input.isFeatured,
            mediaType: input.mediaType,
            projectId,
            sortOrder,
            tags: tagsFromInput(input.tags),
            thumbnailUrl: optionalValue(input.thumbnailUrl),
            title: input.title,
            url: input.url,
            workspaceId: ctx.workspace.id,
          },
          include: { project: { select: { slug: true, title: true } } },
        });

        return { item: galleryItemDto(item) };
      }),
    updateGalleryItem: protectedProcedure
      .input(updateGalleryItemSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const projectId = optionalValue(input.projectId);

        if (projectId) {
          await db.websiteProject.findFirstOrThrow({
            where: { id: projectId, workspaceId: ctx.workspace.id },
          });
        }

        const item = await db.websiteGalleryItem.update({
          data: {
            alt: optionalValue(input.alt),
            capturedAt: optionalDateValue(input.capturedAt),
            dateSource: optionalValue(input.capturedAt) ? "manual" : null,
            description: optionalValue(input.description),
            isFeatured: input.isFeatured,
            mediaType: input.mediaType,
            projectId,
            tags: tagsFromInput(input.tags),
            thumbnailUrl: optionalValue(input.thumbnailUrl),
            title: input.title,
            url: input.url,
          },
          include: { project: { select: { slug: true, title: true } } },
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: galleryItemDto(item) };
      }),
    deleteGalleryItem: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.websiteGalleryItem.delete({
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: { id: input.id } };
      }),
    reorderGallery: protectedProcedure
      .input(reorderWebsiteItemsSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.$transaction(
          input.ids.map((id, sortOrder) =>
            db.websiteGalleryItem.updateMany({
              data: { sortOrder },
              where: { id, workspaceId: ctx.workspace.id },
            }),
          ),
        );

        return { item: { ids: input.ids } };
      }),
    createProject: protectedProcedure
      .input(createWebsiteProjectSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const sortOrder = await db.websiteProject.count({
          where: { workspaceId: ctx.workspace.id },
        });
        const slug = await uniqueProjectSlug({
          slug: input.slug,
          title: input.title,
          workspaceId: ctx.workspace.id,
        });
        const item = await db.websiteProject.create({
          data: {
            clientName: optionalValue(input.clientName),
            coverImageUrl: optionalValue(input.coverImageUrl),
            description: optionalValue(input.description),
            location: optionalValue(input.location),
            log: optionalValue(input.log),
            publishedAt: input.publishedAt ?? new Date(),
            serviceType: optionalValue(input.serviceType),
            slug,
            sortOrder,
            status: input.status,
            summary: input.summary,
            title: input.title,
            workspaceId: ctx.workspace.id,
            year: input.year,
          },
          include: { media: true },
        });

        return { item: projectDto(item) };
      }),
    updateProject: protectedProcedure
      .input(updateWebsiteProjectSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const slug = await uniqueProjectSlug({
          id: input.id,
          slug: input.slug,
          title: input.title,
          workspaceId: ctx.workspace.id,
        });
        const item = await db.websiteProject.update({
          data: {
            clientName: optionalValue(input.clientName),
            coverImageUrl: optionalValue(input.coverImageUrl),
            description: optionalValue(input.description),
            location: optionalValue(input.location),
            log: optionalValue(input.log),
            publishedAt: input.publishedAt ?? new Date(),
            serviceType: optionalValue(input.serviceType),
            slug,
            status: input.status,
            summary: input.summary,
            title: input.title,
            year: input.year,
          },
          include: { media: { orderBy: { sortOrder: "asc" } } },
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: projectDto(item) };
      }),
    deleteProject: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.websiteProject.delete({
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: { id: input.id } };
      }),
    reorderProjects: protectedProcedure
      .input(reorderWebsiteItemsSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.$transaction(
          input.ids.map((id, sortOrder) =>
            db.websiteProject.updateMany({
              data: { sortOrder },
              where: { id, workspaceId: ctx.workspace.id },
            }),
          ),
        );

        return { item: { ids: input.ids } };
      }),
    createProjectMedia: protectedProcedure
      .input(createProjectMediaSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const project = await db.websiteProject.findFirstOrThrow({
          where: { id: input.projectId, workspaceId: ctx.workspace.id },
        });
        const sortOrder = await db.websiteProjectMedia.count({
          where: { projectId: project.id, workspaceId: ctx.workspace.id },
        });
        const item = await db.websiteProjectMedia.create({
          data: {
            alt: optionalValue(input.alt),
            caption: optionalValue(input.caption),
            mediaType: input.mediaType,
            projectId: project.id,
            sortOrder,
            thumbnailUrl: optionalValue(input.thumbnailUrl),
            url: input.url,
            workspaceId: ctx.workspace.id,
          },
        });

        return { item: projectMediaDto(item) };
      }),
    updateProjectMedia: protectedProcedure
      .input(updateProjectMediaSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.websiteProject.findFirstOrThrow({
          where: { id: input.projectId, workspaceId: ctx.workspace.id },
        });
        const item = await db.websiteProjectMedia.update({
          data: {
            alt: optionalValue(input.alt),
            caption: optionalValue(input.caption),
            mediaType: input.mediaType,
            projectId: input.projectId,
            thumbnailUrl: optionalValue(input.thumbnailUrl),
            url: input.url,
          },
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: projectMediaDto(item) };
      }),
    deleteProjectMedia: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.websiteProjectMedia.delete({
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: { id: input.id } };
      }),
    reorderProjectMedia: protectedProcedure
      .input(
        reorderWebsiteItemsSchema.extend({
          projectId: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.websiteProject.findFirstOrThrow({
          where: { id: input.projectId, workspaceId: ctx.workspace.id },
        });
        await db.$transaction(
          input.ids.map((id, sortOrder) =>
            db.websiteProjectMedia.updateMany({
              data: { sortOrder },
              where: {
                id,
                projectId: input.projectId,
                workspaceId: ctx.workspace.id,
              },
            }),
          ),
        );

        return { item: { ids: input.ids } };
      }),
    createBlogPost: protectedProcedure
      .input(createBlogPostSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const sortOrder = await db.blogPost.count({
          where: { workspaceId: ctx.workspace.id },
        });
        const slug = await uniqueBlogSlug({
          slug: input.slug,
          title: input.title,
          workspaceId: ctx.workspace.id,
        });
        const item = await db.blogPost.create({
          data: {
            authorName: input.authorName,
            content: input.content,
            coverImageUrl: optionalValue(input.coverImageUrl),
            excerpt: input.excerpt,
            publishedAt: input.publishedAt ?? new Date(),
            slug,
            sortOrder,
            title: input.title,
            workspaceId: ctx.workspace.id,
          },
        });

        return { item: blogPostDto(item) };
      }),
    updateBlogPost: protectedProcedure
      .input(updateBlogPostSchema)
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const slug = await uniqueBlogSlug({
          id: input.id,
          slug: input.slug,
          title: input.title,
          workspaceId: ctx.workspace.id,
        });
        const item = await db.blogPost.update({
          data: {
            authorName: input.authorName,
            content: input.content,
            coverImageUrl: optionalValue(input.coverImageUrl),
            excerpt: input.excerpt,
            publishedAt: input.publishedAt ?? new Date(),
            slug,
            title: input.title,
          },
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: blogPostDto(item) };
      }),
    deleteBlogPost: protectedProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        await db.blogPost.delete({
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: { id: input.id } };
      }),
    updateInquiryStatus: protectedProcedure
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(["new", "reviewed", "replied", "archived"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        requireOwnerOrAdmin(ctx);
        const item = await db.contactInquiry.update({
          data: { status: input.status },
          where: { id: input.id, workspaceId: ctx.workspace.id },
        });

        return { item: inquiryDto(item) };
      }),
  }),
});

const billingRouter = t.router({
  createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx);

    if (process.env.AFTERSERVICE_PAID_CHECKOUT_ENABLED !== "true") {
      return { checkoutUrl: "/billing?checkout=beta" };
    }

    try {
      // Determine product ID based on plan
      const workspace = await getWorkspaceForLimits(ctx.workspace.id);
      const isGrowth = workspace.plan === "growth";
      const isPro = workspace.plan === "pro";

      // Resolve or create Polar customer
      let polarCustomer: { id: string };
      try {
        polarCustomer = await polarApi.customers.getExternal({
          externalId: ctx.workspace.id,
        });
      } catch {
        polarCustomer = await polarApi.customers.create({
          externalId: ctx.workspace.id,
          email: ctx.user!.email ?? "",
          name: workspace.name ?? undefined,
        });
      }

      const productId = isPro
        ? process.env.POLAR_GROWTH_VARIANT_ID
        : isGrowth
          ? process.env.POLAR_SHOP_VARIANT_ID
          : process.env.POLAR_STARTER_VARIANT_ID;

      if (!productId) {
        return { checkoutUrl: "/billing?checkout=not-configured" };
      }

      const checkout = await polarApi.checkouts.create({
        products: [productId],
        allowDiscountCodes: false,
        customerId: polarCustomer.id,
        metadata: {
          teamId: ctx.workspace.id,
          companyName: workspace.name ?? "",
        },
      });

      return { checkoutUrl: checkout.url };
    } catch (e) {
      console.error(e);
      return { checkoutUrl: "/billing?checkout=error" };
    }
  }),
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    const workspace = await getWorkspaceForLimits(ctx.workspace.id);
    const subscription = await db.subscription.findFirst({
      orderBy: { updatedAt: "desc" },
      where: { workspaceId: ctx.workspace.id },
    });
    const usage = {
      customers: await db.customer.count({
        where: { archivedAt: null, workspaceId: ctx.workspace.id },
      }),
      followUps: await db.followUp.count({
        where: { workspaceId: ctx.workspace.id },
      }),
      teamMembers: await db.membership.count({
        where: { workspaceId: ctx.workspace.id },
      }),
      templates: await db.followUpTemplate.count({
        where: { workspaceId: ctx.workspace.id },
      }),
    };

    return {
      item: {
        isCheckoutEnabled:
          process.env.AFTERSERVICE_PAID_CHECKOUT_ENABLED === "true",
        limits: workspace.limits,
        plan: workspace.plan,
        planDisplayName: publicPlanName(workspace.plan, workspace.planStatus),
        planStatus: workspace.planStatus,
        subscription,
        usage,
      },
    };
  }),
  getPortalUrl: protectedProcedure.query(async ({ ctx }) => {
    requireOwnerOrAdmin(ctx);

    try {
      let polarCustomer: { id: string };
      try {
        polarCustomer = await polarApi.customers.getExternal({
          externalId: ctx.workspace.id,
        });
      } catch {
        return { portalUrl: null };
      }

      const result = await polarApi.customerSessions.create({
        customerId: polarCustomer.id,
      });

      return {
        portalUrl: result.customerPortalUrl ?? null,
      };
    } catch {
      return { portalUrl: null };
    }
  }),
});

const dashboardRouter = t.router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    return getDashboardOverview(db, ctx.workspace.id);
  }),
});

export const appRouter = t.router({
  billing: billingRouter,
  customers: customersRouter,
  dashboard: dashboardRouter,
  followUps: followUpsRouter,
  health: t.procedure.query(() => ({
    ok: true,
    service: "afterservice-api",
  })),
  quotations: quotationsRouter,
  serviceJobs: serviceJobsRouter,
  templates: templatesRouter,
  website: websiteRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
