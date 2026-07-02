import {
  getDashboardOverview,
  getDbClient,
  type Prisma,
  type WorkspacePlan,
} from "@afterservice/db";
import { LogEvents } from "@afterservice/events";
import { setupAnalytics } from "@afterservice/events/server";
import { Notifications } from "@afterservice/notifications";
import { tasks } from "@trigger.dev/sdk/v3";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import type { ApiContext } from "../context";
import { polarApi } from "../utils/polar";

const t = initTRPC.context<ApiContext>().create({
  transformer: superjson,
});

const db = getDbClient();
const notifications = new Notifications(db);

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

function requireOwnerOrAdmin(ctx: ApiContext) {
  if (ctx.workspace?.role !== "owner" && ctx.workspace?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner or admin access is required.",
    });
  }
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
  serviceJobs: serviceJobsRouter,
  templates: templatesRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
