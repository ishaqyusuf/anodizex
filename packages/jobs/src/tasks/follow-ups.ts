import { logger, schedules, task } from "@trigger.dev/sdk/v3";
import { markMissedFollowUps, runDueFollowUpsDryRun } from "../index";

const MARK_MISSED_FOLLOW_UPS_TASK_ID = "mark-missed-follow-ups" as const;
const DRY_RUN_DUE_FOLLOW_UPS_TASK_ID = "dry-run-due-follow-ups" as const;

export const markMissedFollowUpsSchedule = schedules.task({
  id: MARK_MISSED_FOLLOW_UPS_TASK_ID,
  cron: {
    pattern: "0 * * * *",
    timezone: "UTC",
  },
  maxDuration: 60,
  queue: {
    concurrencyLimit: 1,
  },
  run: async () => {
    const result = await markMissedFollowUps();

    logger.info("Marked missed follow-ups", result);

    return result;
  },
});

export const dryRunDueFollowUps = task({
  id: DRY_RUN_DUE_FOLLOW_UPS_TASK_ID,
  run: async () => {
    const result = await runDueFollowUpsDryRun();

    logger.info("Dry-ran due follow-ups", result);

    return result;
  },
});
