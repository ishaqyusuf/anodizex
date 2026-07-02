#!/usr/bin/env bun

import { createHmac } from "node:crypto";
import { createContext } from "../apps/api/src/context.ts";
import { appRouter } from "../apps/api/src/routers/_app.ts";
import { getDbClient } from "../packages/db/src/index.ts";

const dashboardUrl = process.env.SMOKE_DASHBOARD_URL ?? "http://localhost:4101";
const db = getDbClient();
const createdWorkspaceIds = new Set();
const createdUserEmails = new Set();

function log(message) {
  console.log(`[smoke:mvp] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseSetCookies(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const value = headers.get("set-cookie");
  return value ? [value] : [];
}

function mergeCookies(cookieHeader, setCookies) {
  const jar = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), part.slice(index + 1)];
      }),
  );

  for (const cookie of setCookies) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    if (index > 0) {
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
  }

  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function postJson(url, body, cookieHeader = "") {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    method: "POST",
    redirect: "manual",
  });

  return {
    cookieHeader: mergeCookies(cookieHeader, parseSetCookies(response.headers)),
    json: await readJson(response).catch(() => null),
    response,
  };
}

async function createCallerFromCookie(cookieHeader) {
  const request = new Request("http://afterservice.local/trpc", {
    headers: { cookie: cookieHeader },
  });
  const context = await createContext(request);
  return appRouter.createCaller(context);
}

function createCallerFromContext(context) {
  return appRouter.createCaller({
    requestId: crypto.randomUUID(),
    session: null,
    ...context,
  });
}

async function runAuthAndOperatorSmoke() {
  const id = uniqueId();
  const email = `smoke-${id}@afterservice.test`;
  const password = "password123";
  const workspaceName = `Smoke Workspace ${id.slice(0, 8)}`;
  createdUserEmails.add(email);

  log("signing up through dashboard same-origin auth");
  const signUp = await postJson(`${dashboardUrl}/api/auth/sign-up/email`, {
    callbackURL: "/onboarding",
    email,
    name: "Smoke Operator",
    password,
  });

  assert(signUp.response.ok, `sign-up failed: ${signUp.response.status}`);
  assert(
    signUp.cookieHeader.includes("better-auth") ||
      signUp.cookieHeader.includes("__Secure-better-auth"),
    "sign-up did not set a Better Auth session cookie",
  );

  log("completing onboarding through dashboard same-origin adapter");
  const onboarding = await postJson(
    `${dashboardUrl}/api/onboarding`,
    {
      businessName: workspaceName,
      businessType: "repair shop",
      defaultFollowUpDelayDays: 7,
      serviceCategory: "appliance repair",
    },
    signUp.cookieHeader,
  );

  assert(
    onboarding.response.ok,
    `onboarding failed: ${onboarding.response.status}`,
  );
  assert(onboarding.json?.workspace?.id, "onboarding did not return workspace");
  createdWorkspaceIds.add(onboarding.json.workspace.id);

  log("verifying protected dashboard route does not bounce to sign-in");
  const home = await fetch(`${dashboardUrl}/`, {
    headers: { cookie: onboarding.cookieHeader },
    redirect: "manual",
  });
  const homeText = await home.text();
  assert(home.status === 200, `dashboard home returned ${home.status}`);
  assert(
    !home.headers.get("location")?.includes("/sign-in"),
    "dashboard redirected to sign-in",
  );
  assert(
    homeText.includes(workspaceName),
    "dashboard home did not render workspace",
  );

  const caller = await createCallerFromCookie(onboarding.cookieHeader);

  log("exercising workspace-scoped CRUD and follow-up workflow");
  const workspace = await caller.workspace.getCurrent();
  assert(
    workspace.item.id === onboarding.json.workspace.id,
    "workspace context mismatch",
  );

  const customer = await caller.customers.create({
    companyName: "Smoke Co",
    email: `customer-${id}@afterservice.test`,
    name: "Smoke Customer",
    notes: "Created by smoke:mvp",
    phone: "555-0100",
    tags: "vip, warranty",
  });
  assert(customer.item.id, "customer create returned no id");

  const customerList = await caller.customers.list({
    search: "Smoke Customer",
  });
  assert(
    customerList.items.some((item) => item.id === customer.item.id),
    "customer list did not include created customer",
  );

  const job = await caller.serviceJobs.create({
    amountCents: 24900,
    completedAt: new Date(),
    customerId: customer.item.id,
    notes: "Completed smoke job",
    serviceCategory: "appliance repair",
    title: "Smoke service job",
  });
  assert(job.item.id, "job create returned no id");

  const followUp = await caller.serviceJobs.createFollowUp({
    channel: "email",
    dueAt: new Date(Date.now() + 86400000),
    jobId: job.item.id,
    notes: "Smoke follow-up draft",
  });
  assert(followUp.item.id, "follow-up create returned no id");

  const sent = await caller.followUps.markSent({
    body: "Checking in after the smoke service.",
    id: followUp.item.id,
    recipient: `customer-${id}@afterservice.test`,
    subject: "Checking in",
  });
  assert(sent.item.status === "sent", "markSent did not update status");
  assert(
    sent.item.messageLogs.length > 0,
    "markSent did not create a message log",
  );

  const replied = await caller.followUps.markReplied({
    id: followUp.item.id,
    notes: "Customer replied",
  });
  assert(
    replied.item.status === "replied",
    "markReplied did not update status",
  );

  const closed = await caller.followUps.close({
    id: followUp.item.id,
    notes: "Closed after reply",
  });
  assert(closed.item.status === "closed", "close did not update status");

  const template = await caller.templates.create({
    body: "Hi {{customer_name}}, thanks for choosing {{business_name}}.",
    channel: "email",
    isDefault: false,
    name: `Smoke Template ${id}`,
    subject: "Smoke template",
  });
  assert(template.item.id, "template create returned no id");

  const defaultTemplate = await caller.templates.setDefault({
    id: template.item.id,
  });
  assert(
    defaultTemplate.item.isDefault,
    "setDefault did not mark template default",
  );

  const billing = await caller.billing.getCurrentPlan();
  assert(
    billing.item.plan === "starter",
    "new workspace should start on starter",
  );
  assert(
    billing.item.usage.customers >= 1,
    "billing usage did not count customers",
  );

  return {
    cookieHeader: onboarding.cookieHeader,
    userEmail: email,
    workspaceId: workspace.item.id,
  };
}

async function runPermissionAndScopeSmoke(primary) {
  log("checking anonymous, role, cross-workspace, and entitlement protections");

  const anonymous = createCallerFromContext({ user: null, workspace: null });
  await expectReject(
    () => anonymous.customers.list({ includeArchived: false }),
    "anonymous customer list should be rejected",
  );

  const staffCaller = createCallerFromContext({
    user: {
      email: "staff@afterservice.test",
      id: "smoke-staff",
      name: "Staff",
    },
    workspace: { id: primary.workspaceId, role: "staff", slug: "smoke-staff" },
  });
  await expectReject(
    () => staffCaller.billing.createCheckout(),
    "staff checkout should be forbidden",
  );

  const otherWorkspace = await db.workspace.create({
    data: { name: "Smoke Other Workspace", slug: `smoke-other-${uniqueId()}` },
  });
  createdWorkspaceIds.add(otherWorkspace.id);
  const otherCustomer = await db.customer.create({
    data: {
      name: "Other Workspace Customer",
      workspaceId: otherWorkspace.id,
    },
  });

  const primaryCaller = await createCallerFromCookie(primary.cookieHeader);
  await expectReject(
    () => primaryCaller.customers.get({ id: otherCustomer.id }),
    "cross-workspace customer read should be rejected",
  );

  const limitWorkspace = await db.workspace.create({
    data: { name: "Smoke Limit Workspace", slug: `smoke-limit-${uniqueId()}` },
  });
  createdWorkspaceIds.add(limitWorkspace.id);
  const limitUser = await db.user.create({
    data: {
      email: `limit-${uniqueId()}@afterservice.test`,
      name: "Limit User",
    },
  });
  createdUserEmails.add(limitUser.email);
  await db.membership.create({
    data: {
      role: "owner",
      userId: limitUser.id,
      workspaceId: limitWorkspace.id,
    },
  });
  await db.customer.createMany({
    data: Array.from({ length: 100 }, (_, index) => ({
      name: `Limit Customer ${index}`,
      workspaceId: limitWorkspace.id,
    })),
  });

  const limitCaller = createCallerFromContext({
    user: { id: limitUser.id, email: limitUser.email, name: limitUser.name },
    workspace: {
      id: limitWorkspace.id,
      role: "owner",
      slug: limitWorkspace.slug,
    },
  });

  await expectReject(
    () => limitCaller.customers.create({ name: "One Too Many" }),
    "starter customer limit should be enforced",
  );
}

async function runWebhookSmoke() {
  log("checking Lemon Squeezy webhook signature and idempotency");

  process.env.LEMON_SQUEEZY_WEBHOOK_SECRET = "smoke-webhook-secret";
  process.env.LEMON_SQUEEZY_GROWTH_VARIANT_ID = "smoke-growth";

  const { default: api } = await import("../apps/api/src/index.ts");
  const workspace = await db.workspace.create({
    data: {
      name: "Smoke Billing Workspace",
      slug: `smoke-billing-${uniqueId()}`,
    },
  });
  createdWorkspaceIds.add(workspace.id);

  const body = JSON.stringify({
    data: {
      attributes: {
        customer_id: "smoke-customer",
        renews_at: new Date(Date.now() + 86400000).toISOString(),
        status: "active",
        variant_id: "smoke-growth",
      },
      id: `sub-${uniqueId()}`,
    },
    meta: {
      custom_data: { workspace_id: workspace.id },
      event_id: `event-${uniqueId()}`,
      event_name: "subscription_created",
    },
  });

  const invalid = await api.fetch(
    new Request("http://api.afterservice.test/webhooks/lemon-squeezy", {
      body,
      headers: { "x-signature": "bad-signature" },
      method: "POST",
    }),
  );
  assert(
    invalid.status === 401,
    `invalid webhook signature returned ${invalid.status}`,
  );

  const signature = createHmac(
    "sha256",
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  )
    .update(body)
    .digest("hex");
  const validRequest = () =>
    new Request("http://api.afterservice.test/webhooks/lemon-squeezy", {
      body,
      headers: { "x-signature": signature },
      method: "POST",
    });

  const valid = await api.fetch(validRequest());
  assert(valid.status === 200, `valid webhook returned ${valid.status}`);

  const updated = await db.workspace.findUniqueOrThrow({
    where: { id: workspace.id },
  });
  assert(updated.plan === "growth", "webhook did not update workspace plan");
  assert(updated.planStatus === "active", "webhook did not update plan status");

  const duplicate = await api.fetch(validRequest());
  const duplicateBody = await duplicate.json();
  assert(
    duplicate.status === 200,
    `duplicate webhook returned ${duplicate.status}`,
  );
  assert(
    duplicateBody.duplicate === true,
    "duplicate webhook was not idempotent",
  );
}

async function runJobEndpointSmoke(primary) {
  log("checking cron-protected follow-up job endpoint");

  process.env.CRON_SECRET = "smoke-cron-secret";
  const { default: api } = await import("../apps/api/src/index.ts");

  const unauthorized = await api.fetch(
    new Request("http://api.afterservice.test/api/jobs/follow-ups/dry-run", {
      body: JSON.stringify({ workspaceId: primary.workspaceId }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }),
  );
  assert(
    unauthorized.status === 401,
    `unauthorized cron job returned ${unauthorized.status}`,
  );

  const authorized = await api.fetch(
    new Request("http://api.afterservice.test/api/jobs/follow-ups/dry-run", {
      body: JSON.stringify({ workspaceId: primary.workspaceId }),
      headers: {
        authorization: "Bearer smoke-cron-secret",
        "content-type": "application/json",
      },
      method: "POST",
    }),
  );
  const body = await authorized.json();
  assert(authorized.status === 200, `cron job returned ${authorized.status}`);
  assert(body.ok === true, "cron job did not return ok");
  assert(body.result?.ok === true, "cron job result did not return ok");
}

async function expectReject(fn, message) {
  try {
    await fn();
  } catch {
    return;
  }

  throw new Error(message);
}

async function cleanup() {
  for (const workspaceId of createdWorkspaceIds) {
    await db.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
  }

  for (const email of createdUserEmails) {
    await db.user.delete({ where: { email } }).catch(() => {});
  }
}

async function main() {
  log(`using dashboard at ${dashboardUrl}`);
  const primary = await runAuthAndOperatorSmoke();
  await runPermissionAndScopeSmoke(primary);
  await runJobEndpointSmoke(primary);
  await runWebhookSmoke();
  log("MVP smoke passed");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await db.$disconnect();
  });
