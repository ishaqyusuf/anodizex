import { createContext } from "@anodizex/api/context";
import { appRouter } from "@anodizex/api/router";
import { headers } from "next/headers";

export async function getServerCaller() {
  const requestHeaders = await headers();
  const request = new Request("http://dashboard.afterservice.local/api/trpc", {
    headers: requestHeaders,
  });
  const context = await createContext(request);

  return appRouter.createCaller(context);
}
