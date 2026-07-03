import { createHmac, timingSafeEqual } from "node:crypto";
import { auth, getTrustedOrigins } from "@anodizex/auth";
import { buildWorkspaceTemplateSeed, getDbClient } from "@anodizex/db";
import { markMissedFollowUps, runDueFollowUpsDryRun } from "@anodizex/jobs";
import { getDevAppUrlStrings } from "@anodizex/utils";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { createContext } from "./context";
import { appRouter } from "./routers/_app";
import { onboardingSchema } from "./schemas";

const app = new Hono();
const trustedOrigins = getTrustedOrigins();

app.use(
  "/api/*",
  cors({
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    origin: (origin) => {
      return trustedOrigins.includes(origin) ? origin : trustedOrigins[0];
    },
  }),
);

const followUpJobSchema = z.object({
  markMissed: z.boolean().default(false),
  now: z.iso.datetime().optional(),
  workspaceId: z.string().trim().min(1).optional(),
});

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || `workspace-${crypto.randomUUID().slice(0, 8)}`
  );
}

app.get("/health", (c) => {
  const urls = getDevAppUrlStrings();

  return c.json({
    ok: true,
    service: "afterservice-api",
    urls,
  });
});

function handleTrpcRequest(c: Context) {
  return fetchRequestHandler({
    createContext: () => createContext(c.req.raw),
    endpoint: c.req.path.startsWith("/api/trpc") ? "/api/trpc" : "/trpc",
    req: c.req.raw,
    router: appRouter,
  });
}

app.all("/api/trpc/*", handleTrpcRequest);
app.all("/trpc/*", handleTrpcRequest);

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.post("/api/onboarding", async (c) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const parsed = onboardingSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid onboarding payload",
      },
      400,
    );
  }

  const db = getDbClient();
  const existingMembership = await db.membership.findFirst({
    select: {
      workspace: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
    where: {
      userId: session.user.id,
    },
  });

  if (existingMembership) {
    const workspace = await db.workspace.update({
      data: {
        businessType: parsed.data.businessType || null,
        defaultFollowUpDelayDays: parsed.data.defaultFollowUpDelayDays,
        name: parsed.data.businessName,
        serviceCategory: parsed.data.serviceCategory || null,
      },
      select: {
        id: true,
        slug: true,
      },
      where: {
        id: existingMembership.workspace.id,
      },
    });

    return c.json({
      ok: true,
      workspace,
    });
  }

  const baseSlug = slugify(parsed.data.businessName);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

  const workspace = await db.$transaction(async (tx) => {
    const created = await tx.workspace.create({
      data: {
        businessType: parsed.data.businessType,
        defaultFollowUpDelayDays: parsed.data.defaultFollowUpDelayDays,
        name: parsed.data.businessName,
        serviceCategory: parsed.data.serviceCategory,
        slug,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    await tx.membership.create({
      data: {
        role: "owner",
        userId: session.user.id,
        workspaceId: created.id,
      },
    });

    await tx.followUpTemplate.createMany({
      data: buildWorkspaceTemplateSeed(created.id),
    });

    return created;
  });

  return c.json({
    ok: true,
    workspace,
  });
});

app.post("/api/jobs/follow-ups/dry-run", async (c) => {
  const configuredSecret = process.env.CRON_SECRET;
  const providedSecret =
    c.req.header("authorization")?.replace(/^Bearer\s+/i, "") ??
    c.req.header("x-cron-secret");

  if (!configuredSecret) {
    return c.json({ error: "Cron secret is not configured" }, 503);
  }

  if (!isValidSharedSecret(providedSecret, configuredSecret)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await readOptionalJson(c.req.raw);
  const parsed = followUpJobSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid follow-up job payload" }, 400);
  }

  const options = {
    now: parsed.data.now ? new Date(parsed.data.now) : undefined,
    workspaceId: parsed.data.workspaceId,
  };
  const result = parsed.data.markMissed
    ? await markMissedFollowUps(options)
    : await runDueFollowUpsDryRun(options);

  return c.json({
    mode: parsed.data.markMissed ? "mark-missed" : "dry-run",
    ok: true,
    result,
    service: "afterservice-follow-up-jobs",
  });
});

app.post("/webhooks/lemon-squeezy", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("x-signature") ?? "";
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return c.json(
      { error: "Lemon Squeezy webhook secret is not configured" },
      503,
    );
  }

  if (!isValidLemonSignature(body, signature, webhookSecret)) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  const payload = JSON.parse(body) as LemonWebhookPayload;
  const providerId = String(
    payload.meta?.event_id ?? payload.data?.id ?? crypto.randomUUID(),
  );
  const eventName = String(payload.meta?.event_name ?? "unknown");
  const workspaceId =
    payload.meta?.custom_data?.workspace_id ??
    payload.meta?.custom_data?.workspaceId ??
    null;
  const db = getDbClient();

  const existing = await db.billingEvent.findUnique({
    where: { providerId },
  });

  if (existing?.processedAt) {
    return c.json({ ok: true, duplicate: true });
  }

  await db.billingEvent.upsert({
    create: {
      eventName,
      payload: payload as never,
      providerId,
      workspaceId,
    },
    update: {
      eventName,
      payload: payload as never,
      workspaceId,
    },
    where: { providerId },
  });

  if (workspaceId && isSubscriptionEvent(eventName)) {
    const status = mapLemonStatus(payload.data?.attributes?.status);
    const plan = mapLemonVariant(payload.data?.attributes?.variant_id);

    await db.subscription.upsert({
      create: {
        currentPeriodEnd: parseOptionalDate(
          payload.data?.attributes?.renews_at ??
            payload.data?.attributes?.ends_at,
        ),
        providerCustomerId: toStringOrNull(
          payload.data?.attributes?.customer_id,
        ),
        providerSubId: String(payload.data?.id ?? providerId),
        status,
        variantId: toStringOrNull(payload.data?.attributes?.variant_id),
        workspaceId,
      },
      update: {
        currentPeriodEnd: parseOptionalDate(
          payload.data?.attributes?.renews_at ??
            payload.data?.attributes?.ends_at,
        ),
        providerCustomerId: toStringOrNull(
          payload.data?.attributes?.customer_id,
        ),
        status,
        variantId: toStringOrNull(payload.data?.attributes?.variant_id),
      },
      where: {
        providerSubId: String(payload.data?.id ?? providerId),
      },
    });

    await db.workspace.update({
      data: {
        plan,
        planStatus: status,
      },
      where: { id: workspaceId },
    });
  }

  await db.billingEvent.update({
    data: { processedAt: new Date() },
    where: { providerId },
  });

  return c.json({
    ok: true,
    eventName,
    received: body.length > 0,
    service: "afterservice-lemon-squeezy-webhook",
  });
});

export default {
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 4102),
};

export { app };

type LemonWebhookPayload = {
  data?: {
    attributes?: Record<string, unknown>;
    id?: string | number;
  };
  meta?: {
    custom_data?: Record<string, string | null | undefined>;
    event_id?: string | number;
    event_name?: string;
  };
};

function isValidLemonSignature(
  body: string,
  signature: string,
  secret: string,
) {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const digestBuffer = Buffer.from(digest, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (digestBuffer.length !== signatureBuffer.length) return false;

  return timingSafeEqual(digestBuffer, signatureBuffer);
}

function isValidSharedSecret(provided: string | undefined, expected: string) {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

async function readOptionalJson(request: Request) {
  const body = await request.text();

  if (!body.trim()) {
    return {};
  }

  return JSON.parse(body) as unknown;
}

function isSubscriptionEvent(eventName: string) {
  return [
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
    "subscription_paused",
    "subscription_unpaused",
    "subscription_payment_success",
  ].includes(eventName);
}

function mapLemonStatus(value: unknown) {
  const status = String(value ?? "").toLowerCase();

  if (status === "active") return "active";
  if (status === "past_due" || status === "paused" || status === "expired") {
    return "past_due";
  }
  if (status === "cancelled" || status === "canceled") return "canceled";

  return "trialing";
}

function mapLemonVariant(value: unknown) {
  const variantId = String(value ?? "");

  if (variantId === process.env.LEMON_SQUEEZY_PRO_VARIANT_ID) return "pro";
  if (variantId === process.env.LEMON_SQUEEZY_GROWTH_VARIANT_ID) {
    return "growth";
  }

  return "starter";
}

function parseOptionalDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStringOrNull(value: unknown) {
  return value == null ? null : String(value);
}
