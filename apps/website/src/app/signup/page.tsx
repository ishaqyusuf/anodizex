import { buildDashboardUrl } from "@anodizex/utils";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { createPageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Join Free Beta | afterservice",
    description:
      "Create a free beta afterservice workspace for post-job customer follow-up. No credit card required.",
    noIndex: true,
    path: "/signup",
  });
}

export default async function SignupPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const dashboardUrl = buildDashboardUrl({
    currentHost: host,
    currentProtocol: protocol,
    path: "/sign-up",
  });

  return (
    <main className="site-page">
      <h1>Sign up</h1>
      <p>Workspace onboarding will begin from the dashboard app.</p>
      <a href={dashboardUrl}>Create workspace</a>
    </main>
  );
}
