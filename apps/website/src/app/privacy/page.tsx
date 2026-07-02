import { appMetadata } from "@afterservice/utils";
import type { Metadata } from "next";
import { createPageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Privacy Policy | afterservice",
    description:
      "Privacy policy for afterservice, the post-job follow-up board for local service operators.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  return (
    <main className="site-page">
      <span className="site-kicker">Legal</span>
      <h1>Privacy policy</h1>
      <p>
        afterservice stores operator account, workspace, customer, service job,
        follow-up, message log, and billing data so teams can run after-service
        workflows. Customer communication is manual-send in the MVP.
      </p>
      <p>
        Production deployments should configure database access, auth secrets,
        Lemon Squeezy webhooks, and observability before collecting live
        customer data.
      </p>
      <a href="/signup">Start setup</a>
      <p className="site-note">
        This placeholder is for MVP readiness and should be reviewed by counsel
        before public launch of {appMetadata.name}.
      </p>
    </main>
  );
}
