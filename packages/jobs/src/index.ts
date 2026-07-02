import { getDbClient } from "@afterservice/db";

export type DueFollowUpJobOptions = {
  now?: Date;
  workspaceId?: string;
};

export type JobResult = {
  missed: number;
  ok: boolean;
  processed: number;
};

export async function findDueFollowUps(options: DueFollowUpJobOptions = {}) {
  const db = getDbClient();
  const now = options.now ?? new Date();

  return db.followUp.findMany({
    include: {
      customer: true,
      job: true,
      template: true,
    },
    orderBy: {
      dueAt: "asc",
    },
    where: {
      dueAt: { lte: now },
      status: { in: ["open", "scheduled"] },
      workspaceId: options.workspaceId,
    },
  });
}

export async function markMissedFollowUps(
  options: DueFollowUpJobOptions = {},
): Promise<JobResult> {
  const db = getDbClient();
  const now = options.now ?? new Date();
  const result = await db.followUp.updateMany({
    data: {
      status: "missed",
    },
    where: {
      dueAt: { lt: now },
      status: { in: ["open", "scheduled"] },
      workspaceId: options.workspaceId,
    },
  });

  return {
    missed: result.count,
    ok: true,
    processed: result.count,
  };
}

export async function runDueFollowUpsDryRun(
  options: DueFollowUpJobOptions = {},
): Promise<JobResult> {
  const due = await findDueFollowUps(options);

  return {
    missed: due.filter(
      (followUp) => followUp.dueAt < (options.now ?? new Date()),
    ).length,
    ok: true,
    processed: due.length,
  };
}
