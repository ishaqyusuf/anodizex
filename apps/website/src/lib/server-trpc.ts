import "server-only";

import { createContext } from "@anodizex/api/context";
import { appRouter } from "@anodizex/api/router";
import { headers } from "next/headers";

export async function getWebsiteCaller() {
  const requestHeaders = await headers();
  const request = new Request("http://www.afterservice.local/api/trpc", {
    headers: requestHeaders,
  });
  const context = await createContext(request);

  return appRouter.createCaller(context);
}
