import { getDbClient } from "@afterservice/db";
import { logger, schedules } from "@trigger.dev/sdk/v3";

const TASK_ID = "daily-analytics-review" as const;
const OPENPANEL_INSIGHTS_BASE_URL = "https://api.openpanel.dev/insights";
const LAGOS_UTC_OFFSET = "+01:00";

type EmailEnv = {
  emailFrom: string;
  resendApiKey: string;
  testEmail: string;
};

type OpenPanelEnv = {
  openPanelClientId: string;
  openPanelClientSecret: string;
  openPanelProjectId: string;
};

type AnalyticsReviewEnv = {
  email: EmailEnv | null;
  missingEmailKeys: string[];
  missingOpenPanelKeys: string[];
  openPanel: OpenPanelEnv | null;
};

type ReportWindow = {
  end: Date;
  endDate: string;
  previousEnd: Date;
  previousStart: Date;
  reportDate: string;
  start: Date;
  startDate: string;
};

type OpenPanelSection = {
  error?: string;
  rows: OpenPanelRow[];
};

type OpenPanelRow = {
  label: string;
  value: string;
};

type OpenPanelReport = {
  country: OpenPanelSection;
  device: OpenPanelSection;
  metrics: OpenPanelSection;
  pages: OpenPanelSection;
  referrers: OpenPanelSection;
  utmSources: OpenPanelSection;
};

type DatabaseReport = {
  daily: {
    customers: number;
    followUps: number;
    jobs: number;
    messageLogs: number;
    templates: number;
    users: number;
    workspaces: number;
  };
  followUpsByStatus: Array<{ count: number; status: string }>;
  totals: {
    customers: number;
    followUps: number;
    jobs: number;
    messageLogs: number;
    templates: number;
    users: number;
    workspaces: number;
  };
  topWorkspaces: Array<{
    activity: number;
    customers: number;
    followUps: number;
    jobs: number;
    messageLogs: number;
    name: string;
    slug: string;
  }>;
  workspacesByStatus: Array<{ count: number; status: string }>;
};

type WorkspaceActivity = {
  customers: number;
  followUps: number;
  jobs: number;
  messageLogs: number;
};

function readEnvGroup<const Key extends string>(
  keys: readonly Key[],
): { missing: Key[]; values: Partial<Record<Key, string>> } {
  const values = Object.fromEntries(
    keys.flatMap((key) => {
      const value = process.env[key]?.trim();
      return value ? [[key, value]] : [];
    }),
  ) as Partial<Record<Key, string>>;
  const missing = keys.filter((key) => !values[key]);

  return { missing, values };
}

function readAnalyticsReviewEnv(): AnalyticsReviewEnv {
  const emailKeys = [
    "EMAIL_FROM_ADDRESS",
    "RESEND_API_KEY",
    "TEST_EMAIL",
  ] as const;
  const openPanelKeys = [
    "OPENPANEL_PROJECT_ID",
    "OPENPANEL_READ_CLIENT_ID",
    "OPENPANEL_READ_CLIENT_SECRET",
  ] as const;
  const email = readEnvGroup(emailKeys);
  const openPanel = readEnvGroup(openPanelKeys);

  return {
    email:
      email.missing.length === 0
        ? {
            emailFrom: email.values.EMAIL_FROM_ADDRESS!,
            resendApiKey: email.values.RESEND_API_KEY!,
            testEmail: email.values.TEST_EMAIL!,
          }
        : null,
    missingEmailKeys: email.missing,
    missingOpenPanelKeys: openPanel.missing,
    openPanel:
      openPanel.missing.length === 0
        ? {
            openPanelClientId: openPanel.values.OPENPANEL_READ_CLIENT_ID!,
            openPanelClientSecret:
              openPanel.values.OPENPANEL_READ_CLIENT_SECRET!,
            openPanelProjectId: openPanel.values.OPENPANEL_PROJECT_ID!,
          }
        : null,
  };
}

function missingReason(keys: string[]) {
  return `Missing required env vars: ${keys.join(", ")}`;
}

function unavailableOpenPanelReport(reason: string): OpenPanelReport {
  const section = { error: reason, rows: [] };

  return {
    country: section,
    device: section,
    metrics: section,
    pages: section,
    referrers: section,
    utmSources: section,
  };
}

function compactSummary(rows: Array<{ label: string; value: number }>) {
  return Object.fromEntries(rows.map((row) => [row.label, row.value]));
}

function summarizeDatabaseReport(database: DatabaseReport) {
  return {
    daily: compactSummary([
      { label: "jobs", value: database.daily.jobs },
      { label: "customers", value: database.daily.customers },
      { label: "templates", value: database.daily.templates },
      { label: "followUps", value: database.daily.followUps },
      { label: "messageLogs", value: database.daily.messageLogs },
      { label: "users", value: database.daily.users },
      { label: "workspaces", value: database.daily.workspaces },
    ]),
    topWorkspaces: database.topWorkspaces.map((workspace) => ({
      activity: workspace.activity,
      slug: workspace.slug,
    })),
    totals: compactSummary([
      { label: "jobs", value: database.totals.jobs },
      { label: "customers", value: database.totals.customers },
      { label: "templates", value: database.totals.templates },
      { label: "followUps", value: database.totals.followUps },
      { label: "messageLogs", value: database.totals.messageLogs },
      { label: "users", value: database.totals.users },
      { label: "workspaces", value: database.totals.workspaces },
    ]),
  };
}

function lagosDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Lagos",
    year: "numeric",
  }).format(date);
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00${LAGOS_UTC_OFFSET}`);
  date.setUTCDate(date.getUTCDate() + days);
  return lagosDateString(date);
}

function startOfLagosDate(dateString: string) {
  return new Date(`${dateString}T00:00:00${LAGOS_UTC_OFFSET}`);
}

function getReportWindow(now = new Date()): ReportWindow {
  const today = lagosDateString(now);
  const reportDate = addDays(today, -1);
  const previousDate = addDays(reportDate, -1);
  const nextDate = addDays(reportDate, 1);

  return {
    end: startOfLagosDate(nextDate),
    endDate: nextDate,
    previousEnd: startOfLagosDate(reportDate),
    previousStart: startOfLagosDate(previousDate),
    reportDate,
    start: startOfLagosDate(reportDate),
    startDate: reportDate,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(1)}%`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);

  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function numberFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function stringFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function collectRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      isRecord(item) ? [item, ...collectRecords(Object.values(item))] : [],
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  return [
    value,
    ...Object.values(value).flatMap((nested) => collectRecords(nested)),
  ];
}

function firstMetric(payload: unknown, keys: string[]) {
  for (const record of collectRecords(payload)) {
    const value = numberFromRecord(record, keys);

    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function createMetricsRows(payload: unknown): OpenPanelRow[] {
  const sessions = firstMetric(payload, ["sessions", "session"]);
  const visitors = firstMetric(payload, [
    "visitors",
    "uniqueVisitors",
    "unique_visitors",
    "users",
  ]);
  const pageviews = firstMetric(payload, [
    "pageviews",
    "pageViews",
    "views",
  ]);
  const bounceRate = firstMetric(payload, [
    "bounceRate",
    "bounce_rate",
    "bounce",
  ]);
  const duration = firstMetric(payload, [
    "averageSessionDuration",
    "avgSessionDuration",
    "avg_duration",
    "duration",
  ]);

  return [
    sessions === undefined
      ? undefined
      : { label: "Sessions", value: formatNumber(sessions) },
    visitors === undefined
      ? undefined
      : { label: "Visitors", value: formatNumber(visitors) },
    pageviews === undefined
      ? undefined
      : { label: "Pageviews", value: formatNumber(pageviews) },
    bounceRate === undefined
      ? undefined
      : { label: "Bounce rate", value: formatPercent(bounceRate) },
    duration === undefined
      ? undefined
      : { label: "Avg duration", value: formatDuration(duration) },
  ].filter((row): row is OpenPanelRow => Boolean(row));
}

function createTopRows(payload: unknown, fallbackLabel: string): OpenPanelRow[] {
  return collectRecords(payload)
    .map((record) => {
      const label =
        stringFromRecord(record, [
          "path",
          "url",
          "page",
          "name",
          "title",
          "referrer",
          "referrer_name",
          "utm_source",
          "device",
          "country",
          "label",
          "key",
          "value",
        ]) ?? fallbackLabel;
      const value = numberFromRecord(record, [
        "pageviews",
        "pageViews",
        "sessions",
        "visitors",
        "count",
        "total",
        "value",
      ]);

      return value === undefined
        ? undefined
        : {
            label,
            value: formatNumber(value),
          };
    })
    .filter((row): row is OpenPanelRow => Boolean(row))
    .filter(
      (row, index, rows) =>
        rows.findIndex(
          (candidate) =>
            candidate.label === row.label && candidate.value === row.value,
        ) === index,
    )
    .slice(0, 5);
}

async function fetchOpenPanelJson(
  env: OpenPanelEnv,
  endpoint: string,
  window: ReportWindow,
) {
  const url = new URL(
    `${OPENPANEL_INSIGHTS_BASE_URL}/${env.openPanelProjectId}/${endpoint}`,
  );
  url.searchParams.set("range", "custom");
  url.searchParams.set("startDate", window.start.toISOString());
  url.searchParams.set("endDate", window.end.toISOString());

  const response = await fetch(url, {
    headers: {
      "openpanel-client-id": env.openPanelClientId,
      "openpanel-client-secret": env.openPanelClientSecret,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenPanel ${endpoint} returned ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function getOpenPanelSection(
  env: OpenPanelEnv,
  endpoint: string,
  window: ReportWindow,
  parser: (payload: unknown) => OpenPanelRow[],
): Promise<OpenPanelSection> {
  try {
    const payload = await fetchOpenPanelJson(env, endpoint, window);
    const rows = parser(payload);

    return rows.length > 0
      ? { rows }
      : { error: "No parseable rows returned.", rows: [] };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      rows: [],
    };
  }
}

async function getOpenPanelReport(
  env: OpenPanelEnv | null,
  window: ReportWindow,
  unavailableReason?: string,
): Promise<OpenPanelReport> {
  if (!env) {
    return unavailableOpenPanelReport(
      unavailableReason ?? "OpenPanel env is not configured.",
    );
  }

  const [metrics, pages, referrers, utmSources, device, country] =
    await Promise.all([
      getOpenPanelSection(env, "overview", window, createMetricsRows),
      getOpenPanelSection(env, "pages", window, (payload) =>
        createTopRows(payload, "Page"),
      ),
      getOpenPanelSection(env, "traffic/referrers", window, (payload) =>
        createTopRows(payload, "Referrer"),
      ),
      getOpenPanelSection(env, "utm_source", window, (payload) =>
        createTopRows(payload, "UTM source"),
      ),
      getOpenPanelSection(env, "device", window, (payload) =>
        createTopRows(payload, "Device"),
      ),
      getOpenPanelSection(env, "country", window, (payload) =>
        createTopRows(payload, "Country"),
      ),
    ]);

  return { country, device, metrics, pages, referrers, utmSources };
}

function addActivity(
  activity: Map<string, WorkspaceActivity>,
  workspaceId: string,
  key: keyof WorkspaceActivity,
  count: number,
) {
  const current = activity.get(workspaceId) ?? {
    customers: 0,
    followUps: 0,
    jobs: 0,
    messageLogs: 0,
  };

  current[key] += count;
  activity.set(workspaceId, current);
}

async function getDatabaseReport(window: ReportWindow): Promise<DatabaseReport> {
  const db = getDbClient();
  const dateWhere = {
    createdAt: {
      gte: window.start,
      lt: window.end,
    },
  };

  const [
    dailyJobs,
    dailyCustomers,
    dailyTemplates,
    dailyFollowUps,
    dailyMessageLogs,
    dailyUsers,
    dailyWorkspaces,
    totalJobs,
    totalCustomers,
    totalTemplates,
    totalFollowUps,
    totalMessageLogs,
    totalUsers,
    totalWorkspaces,
    followUpsByStatus,
    workspacesByStatus,
    jobActivity,
    customerActivity,
    followUpActivity,
    messageLogActivity,
  ] = await Promise.all([
    db.serviceJob.count({ where: dateWhere }),
    db.customer.count({ where: dateWhere }),
    db.followUpTemplate.count({ where: dateWhere }),
    db.followUp.count({ where: dateWhere }),
    db.messageLog.count({ where: dateWhere }),
    db.user.count({ where: dateWhere }),
    db.workspace.count({ where: dateWhere }),
    db.serviceJob.count(),
    db.customer.count(),
    db.followUpTemplate.count(),
    db.followUp.count(),
    db.messageLog.count(),
    db.user.count(),
    db.workspace.count(),
    db.followUp.groupBy({
      _count: { _all: true },
      by: ["status"],
    }),
    db.workspace.groupBy({
      _count: { _all: true },
      by: ["planStatus"],
    }),
    db.serviceJob.groupBy({
      _count: { _all: true },
      by: ["workspaceId"],
      where: dateWhere,
    }),
    db.customer.groupBy({
      _count: { _all: true },
      by: ["workspaceId"],
      where: dateWhere,
    }),
    db.followUp.groupBy({
      _count: { _all: true },
      by: ["workspaceId"],
      where: dateWhere,
    }),
    db.messageLog.groupBy({
      _count: { _all: true },
      by: ["workspaceId"],
      where: dateWhere,
    }),
  ]);

  const activity = new Map<string, WorkspaceActivity>();

  for (const row of jobActivity) {
    addActivity(activity, row.workspaceId, "jobs", row._count._all);
  }

  for (const row of customerActivity) {
    addActivity(activity, row.workspaceId, "customers", row._count._all);
  }

  for (const row of followUpActivity) {
    addActivity(activity, row.workspaceId, "followUps", row._count._all);
  }

  for (const row of messageLogActivity) {
    addActivity(activity, row.workspaceId, "messageLogs", row._count._all);
  }

  const workspaceIds = [...activity.entries()]
    .map(([workspaceId, values]) => ({
      activity:
        values.jobs + values.customers + values.followUps + values.messageLogs,
      workspaceId,
    }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 5)
    .map((item) => item.workspaceId);
  const workspaces =
    workspaceIds.length > 0
      ? await db.workspace.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
          },
          where: {
            id: { in: workspaceIds },
          },
        })
      : [];
  const workspaceById = new Map(
    workspaces.map((workspace) => [workspace.id, workspace]),
  );
  const topWorkspaces = workspaceIds
    .map((workspaceId) => {
      const counts = activity.get(workspaceId);
      const workspace = workspaceById.get(workspaceId);

      if (!counts || !workspace) {
        return undefined;
      }

      return {
        activity:
          counts.jobs +
          counts.customers +
          counts.followUps +
          counts.messageLogs,
        customers: counts.customers,
        followUps: counts.followUps,
        jobs: counts.jobs,
        messageLogs: counts.messageLogs,
        name: workspace.name,
        slug: workspace.slug,
      };
    })
    .filter((workspace): workspace is DatabaseReport["topWorkspaces"][number] =>
      Boolean(workspace),
    );

  return {
    daily: {
      customers: dailyCustomers,
      followUps: dailyFollowUps,
      jobs: dailyJobs,
      messageLogs: dailyMessageLogs,
      templates: dailyTemplates,
      users: dailyUsers,
      workspaces: dailyWorkspaces,
    },
    followUpsByStatus: followUpsByStatus.map((row) => ({
      count: row._count._all,
      status: row.status,
    })),
    totals: {
      customers: totalCustomers,
      followUps: totalFollowUps,
      jobs: totalJobs,
      messageLogs: totalMessageLogs,
      templates: totalTemplates,
      users: totalUsers,
      workspaces: totalWorkspaces,
    },
    topWorkspaces,
    workspacesByStatus: workspacesByStatus.map((row) => ({
      count: row._count._all,
      status: row.planStatus,
    })),
  };
}

function renderKeyValueGrid(rows: OpenPanelRow[]) {
  if (rows.length === 0) {
    return '<p style="margin:0;color:#667085;">Unavailable.</p>';
  }

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows
    .map(
      (row) => `<tr>
        <td style="padding:6px 0;color:#475467;">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:6px 0;font-weight:600;color:#101828;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

function renderSection(title: string, section: OpenPanelSection) {
  const note = section.error
    ? `<p style="margin:8px 0 0;color:#667085;font-size:12px;">${escapeHtml(section.error)}</p>`
    : "";

  return `<section style="padding:16px;border:1px solid #eaecf0;border-radius:8px;">
    <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">${escapeHtml(title)}</h2>
    ${renderKeyValueGrid(section.rows)}
    ${note}
  </section>`;
}

function renderMetricCards(items: Array<{ label: string; value: number }>) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${items
    .map(
      (item) => `<tr>
        <td style="padding:6px 0;color:#475467;">${escapeHtml(item.label)}</td>
        <td align="right" style="padding:6px 0;font-weight:600;color:#101828;">${formatNumber(item.value)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

function renderStatusRows(rows: Array<{ count: number; status: string }>) {
  return rows.length > 0
    ? renderMetricCards(
        rows.map((row) => ({
          label: row.status.replaceAll("_", " "),
          value: row.count,
        })),
      )
    : '<p style="margin:0;color:#667085;">None.</p>';
}

function renderNoticeList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  return `<section style="margin-bottom:16px;padding:16px;border:1px solid #fecdca;border-radius:8px;background:#fffbfa;">
    <h2 style="margin:0 0 10px;font-size:16px;color:#912018;">Unavailable report sections</h2>
    <ul style="margin:0;padding-left:20px;color:#667085;">${items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>
  </section>`;
}

function renderTopWorkspaces(workspaces: DatabaseReport["topWorkspaces"]) {
  if (workspaces.length === 0) {
    return '<p style="margin:0;color:#667085;">No workspace activity for this review window.</p>';
  }

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${workspaces
    .map(
      (workspace) => `<tr>
        <td style="padding:8px 0;color:#101828;">
          <strong>${escapeHtml(workspace.name)}</strong>
          <span style="color:#667085;">/${escapeHtml(workspace.slug)}</span>
          <div style="color:#667085;font-size:12px;">${formatNumber(
            workspace.jobs,
          )} jobs, ${formatNumber(workspace.customers)} customers, ${formatNumber(
            workspace.followUps,
          )} follow-ups, ${formatNumber(workspace.messageLogs)} messages</div>
        </td>
        <td align="right" style="padding:8px 0;font-weight:600;color:#101828;">${formatNumber(workspace.activity)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

function renderEmail(
  window: ReportWindow,
  openPanel: OpenPanelReport,
  database: DatabaseReport,
  unavailableNotes: string[],
) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;color:#101828;">
    <main style="max-width:720px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 6px;color:#667085;">afterservice daily analytics review</p>
      <h1 style="margin:0 0 4px;font-size:24px;color:#101828;">${escapeHtml(window.reportDate)}</h1>
      <p style="margin:0 0 24px;color:#667085;">Previous Lagos calendar day, ${escapeHtml(window.start.toISOString())} to ${escapeHtml(window.end.toISOString())}.</p>
      ${renderNoticeList(unavailableNotes)}

      <section style="margin-bottom:16px;padding:16px;border:1px solid #eaecf0;border-radius:8px;background:#ffffff;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">Database activity from last review</h2>
        ${renderMetricCards([
          { label: "Jobs created", value: database.daily.jobs },
          { label: "Customers added", value: database.daily.customers },
          { label: "Templates created", value: database.daily.templates },
          { label: "Follow-ups created", value: database.daily.followUps },
          { label: "Messages logged", value: database.daily.messageLogs },
          { label: "Users created", value: database.daily.users },
          { label: "Workspaces created", value: database.daily.workspaces },
        ])}
      </section>

      <section style="margin-bottom:16px;padding:16px;border:1px solid #eaecf0;border-radius:8px;background:#ffffff;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">Current platform totals</h2>
        ${renderMetricCards([
          { label: "Total jobs", value: database.totals.jobs },
          { label: "Total customers", value: database.totals.customers },
          { label: "Total templates", value: database.totals.templates },
          { label: "Total follow-ups", value: database.totals.followUps },
          { label: "Total messages", value: database.totals.messageLogs },
          { label: "Total users", value: database.totals.users },
          { label: "Total workspaces", value: database.totals.workspaces },
        ])}
      </section>

      <section style="margin-bottom:16px;padding:16px;border:1px solid #eaecf0;border-radius:8px;background:#ffffff;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">Top workspaces by daily activity</h2>
        ${renderTopWorkspaces(database.topWorkspaces)}
      </section>

      <section style="margin-bottom:16px;padding:16px;border:1px solid #eaecf0;border-radius:8px;background:#ffffff;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">Follow-ups by status</h2>
        ${renderStatusRows(database.followUpsByStatus)}
      </section>

      <section style="margin-bottom:16px;padding:16px;border:1px solid #eaecf0;border-radius:8px;background:#ffffff;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#101828;">Workspaces by billing status</h2>
        ${renderStatusRows(database.workspacesByStatus)}
      </section>

      <div style="display:grid;gap:16px;">
        ${renderSection("Website overview", openPanel.metrics)}
        ${renderSection("Top pages", openPanel.pages)}
        ${renderSection("Top referrers", openPanel.referrers)}
        ${renderSection("Top UTM sources", openPanel.utmSources)}
        ${renderSection("Top devices", openPanel.device)}
        ${renderSection("Top countries", openPanel.country)}
      </div>
    </main>
  </body>
</html>`;
}

async function sendEmail(env: EmailEnv, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: env.emailFrom,
      html,
      subject,
      to: [env.testEmail],
    }),
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as {
    error?: unknown;
    id?: string;
  } | null;

  if (!response.ok || payload?.error) {
    throw new Error(
      `Resend daily analytics review send failed: ${response.status}`,
    );
  }

  return payload?.id ?? null;
}

export const dailyAnalyticsReview = schedules.task({
  id: TASK_ID,
  cron: {
    pattern: "0 8 * * *",
    timezone: "Africa/Lagos",
  },
  maxDuration: 120,
  queue: {
    concurrencyLimit: 1,
  },
  run: async () => {
    const env = readAnalyticsReviewEnv();
    const window = getReportWindow();
    const unavailableNotes = [
      env.missingOpenPanelKeys.length > 0
        ? `Website analytics unavailable: ${missingReason(
            env.missingOpenPanelKeys,
          )}`
        : undefined,
      env.missingEmailKeys.length > 0
        ? `Email delivery skipped: ${missingReason(env.missingEmailKeys)}`
        : undefined,
    ].filter((note): note is string => Boolean(note));
    const [openPanel, database] = await Promise.all([
      getOpenPanelReport(
        env.openPanel,
        window,
        env.missingOpenPanelKeys.length > 0
          ? missingReason(env.missingOpenPanelKeys)
          : undefined,
      ),
      getDatabaseReport(window),
    ]);
    const subject = `afterservice daily analytics review - ${window.reportDate}`;
    const html = renderEmail(window, openPanel, database, unavailableNotes);
    const providerId = env.email
      ? await sendEmail(env.email, subject, html)
      : null;
    const deliveryStatus = env.email ? "sent" : "skipped";
    const databaseSummary = summarizeDatabaseReport(database);

    logger.info("Processed daily analytics review", {
      deliveryStatus,
      missingEmailKeys: env.missingEmailKeys,
      missingOpenPanelKeys: env.missingOpenPanelKeys,
      openPanelSections: Object.values(openPanel).filter(
        (section) => section.rows.length > 0,
      ).length,
      providerId: providerId ? "set" : null,
      reportDate: window.reportDate,
      topWorkspaces: database.topWorkspaces.length,
    });

    return {
      ok: true,
      database: databaseSummary,
      deliveryStatus,
      missingEmailKeys: env.missingEmailKeys,
      missingOpenPanelKeys: env.missingOpenPanelKeys,
      providerId: providerId ? "set" : null,
      reportDate: window.reportDate,
      sentTo: env.email ? "TEST_EMAIL" : null,
    };
  },
});
