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

export const onboardingSchema = z.object({
  businessName: businessNameSchema,
  businessType: z.string().trim().optional(),
  defaultFollowUpDelayDays: z.coerce.number().int().min(1).max(365).default(7),
  serviceCategory: z.string().trim().optional(),
});
