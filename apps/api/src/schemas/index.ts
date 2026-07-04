import { z } from "zod";

export const RESERVED_BUSINESS_NAMES = [
  "admin",
  "administrator",
  "afterservice",
  "afterservice app",
  "api",
  "dashboard",
  "demo",
  "root",
  "support",
  "system",
  "test",
] as const;

const RESERVED_BUSINESS_NAME_KEYS = new Set(
  RESERVED_BUSINESS_NAMES.map((name) => normalizeBusinessName(name)),
);

export function normalizeBusinessName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isReservedBusinessName(value: string) {
  return RESERVED_BUSINESS_NAME_KEYS.has(normalizeBusinessName(value));
}

const businessNameSchema = z
  .string()
  .trim()
  .min(1, "Business name is required")
  .refine((value) => !isReservedBusinessName(value), {
    message: "Use your business name instead of a reserved afterservice name",
  });

export const channelSchema = z.enum(["email", "sms", "phone", "whatsapp"]);
export const websiteMediaTypeSchema = z.enum(["image", "video"]);
export const projectQuotationStatusSchema = z.enum([
  "draft",
  "sent",
  "approved",
  "declined",
  "expired",
]);
export const followUpStatusSchema = z.enum([
  "open",
  "scheduled",
  "sent",
  "replied",
  "closed",
  "missed",
]);
export const serviceJobStatusSchema = z.enum([
  "completed",
  "needs_follow_up",
  "resolved",
]);

export const createCustomerSchema = z.object({
  companyName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required"),
  notes: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

export const updateCustomerSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required"),
  notes: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  tags: z.string().trim().optional(),
});

export const createJobSchema = z.object({
  amountDollars: z.coerce.number().nonnegative().optional(),
  amountCents: z.coerce.number().int().nonnegative().optional(),
  completedAt: z.coerce.date(),
  customerId: z.string().min(1, "Customer is required"),
  nextFollowUpAt: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
  serviceCategory: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
});

export const updateJobSchema = z.object({
  id: z.string().min(1),
  amountCents: z.coerce.number().int().nonnegative().optional(),
  completedAt: z.coerce.date(),
  nextFollowUpAt: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
  serviceCategory: z.string().trim().optional(),
  status: serviceJobStatusSchema.default("completed"),
  title: z.string().trim().min(1),
});

export const createFollowUpSchema = z.object({
  channel: channelSchema.default("email"),
  customerId: z.string().min(1, "Customer is required"),
  dueAt: z.coerce.date(),
  jobId: z.string().trim().min(1).optional().or(z.literal("")),
  notes: z.string().trim().optional(),
  templateId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const updateFollowUpSchema = z.object({
  id: z.string().min(1),
  channel: channelSchema,
  dueAt: z.coerce.date(),
  notes: z.string().trim().optional(),
  status: followUpStatusSchema,
  templateId: z.string().min(1).optional(),
});

export const createTemplateSchema = z.object({
  body: z.string().trim().min(1, "Body is required"),
  channel: channelSchema.default("email"),
  isDefault: z.boolean().default(false),
  name: z.string().trim().min(1, "Name is required"),
  subject: z.string().trim().optional(),
});

export const updateTemplateSchema = z.object({
  id: z.string().min(1),
  body: z.string().trim().min(1),
  channel: channelSchema,
  isDefault: z.boolean().default(false),
  name: z.string().trim().min(1),
  subject: z.string().trim().optional(),
});

export const updateWorkspaceSettingsSchema = z.object({
  businessType: z.string().trim().optional(),
  defaultFollowUpDelayDays: z.coerce.number().int().min(1).max(365),
  name: businessNameSchema,
  serviceCategory: z.string().trim().optional(),
});

const optionalUrlSchema = z.string().trim().url().optional().or(z.literal(""));

const optionalStringSchema = z.string().trim().optional();

export const websiteSettingsSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: optionalStringSchema,
  city: optionalStringSchema,
  companyName: z.string().trim().min(1, "Company name is required"),
  country: z.string().trim().min(1, "Country is required"),
  description: z.string().trim().min(20, "Description is too short"),
  email: z.string().trim().email("Enter a valid contact email"),
  headline: z.string().trim().min(8, "Headline is too short"),
  heroImageUrl: optionalUrlSchema,
  instagramUrl: optionalUrlSchema,
  linkedinUrl: optionalUrlSchema,
  mapUrl: optionalUrlSchema,
  officeHours: z.string().trim().min(1, "Office hours are required"),
  phone: z.string().trim().min(1, "Phone number is required"),
  region: optionalStringSchema,
  whatsappUrl: optionalUrlSchema,
});

export const createGalleryItemSchema = z.object({
  alt: optionalStringSchema,
  capturedAt: optionalStringSchema,
  description: optionalStringSchema,
  isFeatured: z.boolean().default(true),
  mediaType: websiteMediaTypeSchema.default("image"),
  projectId: z.string().trim().min(1).optional().or(z.literal("")),
  tags: optionalStringSchema,
  thumbnailUrl: optionalUrlSchema,
  title: z.string().trim().min(1, "Title is required"),
  url: z.string().trim().url("Enter a valid media URL"),
});

export const updateGalleryItemSchema = createGalleryItemSchema.extend({
  id: z.string().min(1),
});

export const createWebsiteProjectSchema = z.object({
  clientName: optionalStringSchema,
  coverImageUrl: optionalUrlSchema,
  description: optionalStringSchema,
  location: optionalStringSchema,
  log: optionalStringSchema,
  publishedAt: z.coerce.date().optional(),
  serviceType: optionalStringSchema,
  slug: optionalStringSchema,
  status: z.string().trim().min(1).default("completed"),
  summary: z.string().trim().min(12, "Summary is too short"),
  title: z.string().trim().min(1, "Project title is required"),
  year: z.coerce.number().int().min(1900).max(2100),
});

export const updateWebsiteProjectSchema = createWebsiteProjectSchema.extend({
  id: z.string().min(1),
});

export const createProjectMediaSchema = z.object({
  alt: optionalStringSchema,
  caption: optionalStringSchema,
  mediaType: websiteMediaTypeSchema.default("image"),
  projectId: z.string().trim().min(1, "Project is required"),
  thumbnailUrl: optionalUrlSchema,
  url: z.string().trim().url("Enter a valid media URL"),
});

export const updateProjectMediaSchema = createProjectMediaSchema.extend({
  id: z.string().min(1),
});

export const createBlogPostSchema = z.object({
  authorName: z.string().trim().min(1).default("Anodizex"),
  content: z.string().trim().min(40, "Post content is too short"),
  coverImageUrl: optionalUrlSchema,
  excerpt: z.string().trim().min(12, "Excerpt is too short"),
  publishedAt: z.coerce.date().optional(),
  slug: optionalStringSchema,
  title: z.string().trim().min(1, "Post title is required"),
});

export const updateBlogPostSchema = createBlogPostSchema.extend({
  id: z.string().min(1),
});

export const reorderWebsiteItemsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const contactInquirySchema = z.object({
  companyName: optionalStringSchema,
  email: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().min(20, "Please add a little more detail"),
  name: z.string().trim().min(1, "Name is required"),
  phone: optionalStringSchema,
  projectType: optionalStringSchema,
});

export const blobUploadPayloadSchema = z.object({
  kind: z.enum(["gallery", "project", "blog", "settings"]).default("gallery"),
  projectId: z.string().trim().min(1).optional(),
});

const moneyCentsSchema = z.coerce
  .number()
  .int()
  .nonnegative("Amount must be zero or more");

export const createQuotationMaterialSchema = z.object({
  category: optionalStringSchema,
  currentUnitCostCents: moneyCentsSchema,
  name: z.string().trim().min(1, "Material name is required"),
  notes: optionalStringSchema,
  supplier: optionalStringSchema,
  unit: z.string().trim().min(1, "Unit is required"),
});

export const updateQuotationMaterialSchema =
  createQuotationMaterialSchema.extend({
    id: z.string().min(1),
  });

export const updateQuotationMaterialCostSchema = z.object({
  effectiveAt: z.coerce.date().optional(),
  materialId: z.string().min(1, "Material is required"),
  note: optionalStringSchema,
  supplier: optionalStringSchema,
  unitCostCents: moneyCentsSchema,
});

export const createQuotationMaterialSupplierPriceSchema = z.object({
  currency: z.string().trim().min(1).default("NGN"),
  effectiveAt: z.coerce.date().optional(),
  isPreferred: z.boolean().default(false),
  leadTimeDays: z.coerce.number().int().nonnegative().optional(),
  materialId: z.string().min(1, "Material is required"),
  note: optionalStringSchema,
  notes: optionalStringSchema,
  supplierName: z.string().trim().min(1, "Supplier is required"),
  supplierSku: optionalStringSchema,
  unitCostCents: moneyCentsSchema,
});

export const updateQuotationMaterialSupplierPriceSchema =
  createQuotationMaterialSupplierPriceSchema.extend({
    id: z.string().min(1),
  });

const quotationMaterialLineSchema = z.object({
  materialId: z.string().trim().min(1).optional().or(z.literal("")),
  materialName: z.string().trim().optional(),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  supplierName: z.string().trim().optional(),
  supplierPriceId: z.string().trim().min(1).optional().or(z.literal("")),
  unit: z.string().trim().optional(),
  unitCostCents: moneyCentsSchema.optional(),
  wastePercent: z.coerce.number().min(0).max(100).default(0),
});

const quotationUnitSchema = z.object({
  heightMm: z.coerce.number().int().positive("Height is required"),
  label: z.string().trim().min(1, "Unit label is required"),
  laborCostCents: moneyCentsSchema.default(0),
  location: optionalStringSchema,
  materialLines: z
    .array(quotationMaterialLineSchema)
    .min(1, "Add at least one material line"),
  notes: optionalStringSchema,
  quantity: z.coerce.number().int().positive("Quantity is required"),
  unitType: z.string().trim().min(1, "Unit type is required"),
  widthMm: z.coerce.number().int().positive("Width is required"),
});

export const createProjectQuotationSchema = z.object({
  clientEmail: z.string().trim().email().optional().or(z.literal("")),
  clientName: optionalStringSchema,
  currency: z.string().trim().min(1).default("NGN"),
  customerId: z.string().trim().min(1).optional().or(z.literal("")),
  markupPercent: z.coerce.number().min(0).max(500).default(0),
  notes: optionalStringSchema,
  projectName: z.string().trim().min(1, "Project name is required"),
  siteAddress: optionalStringSchema,
  status: projectQuotationStatusSchema.default("draft"),
  units: z.array(quotationUnitSchema).min(1, "Add at least one BOQ unit"),
  validUntil: z.coerce.date().optional(),
});

export const updateProjectQuotationSchema = createProjectQuotationSchema.extend(
  {
    id: z.string().min(1),
  },
);

export const updateProjectQuotationStatusSchema = z.object({
  id: z.string().min(1),
  status: projectQuotationStatusSchema,
});

export const onboardingSchema = z.object({
  businessName: businessNameSchema,
  businessType: z.string().trim().optional(),
  defaultFollowUpDelayDays: z.coerce.number().int().min(1).max(365).default(7),
  serviceCategory: z.string().trim().optional(),
});
