import { buildDashboardUrl } from "@anodizex/utils";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createPageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Log in | afterservice",
    description: "Log in to your afterservice workspace.",
    noIndex: true,
    path: "/login",
  });
}

export default async function LoginPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const dashboardUrl = buildDashboardUrl({
    currentHost: host,
    currentProtocol: protocol,
    path: "/sign-in",
  });

  return (
    <main className="site-page">
      <h1>Log in</h1>
      <p>Dashboard authentication will connect here in the auth phase.</p>
      <a href={dashboardUrl}>Continue to dashboard login</a>
    </main>
  );
}
