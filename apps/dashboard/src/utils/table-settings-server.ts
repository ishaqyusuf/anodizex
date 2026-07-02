import "server-only";

import { cookies } from "next/headers";
import {
  TABLE_SETTINGS_COOKIE,
  type AllTableSettings,
  type TableId,
  type TableSettings,
} from "./table-settings";

export async function getInitialTableSettings(
  tableId: TableId,
): Promise<Partial<TableSettings> | undefined> {
  const cookieStore = await cookies();
  const rawSettings = cookieStore.get(TABLE_SETTINGS_COOKIE)?.value;

  if (!rawSettings) return undefined;

  try {
    const settings = JSON.parse(rawSettings) as AllTableSettings;
    return settings[tableId];
  } catch {
    return undefined;
  }
}
