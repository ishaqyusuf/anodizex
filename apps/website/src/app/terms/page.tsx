import { appMetadata } from "@afterservice/utils";
import type { Metadata } from "next";
import { createPageMetadata } from "../../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Terms of Service | afterservice",
    description:
      "Terms of service for afterservice, the post-job follow-up board for local service operators.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  return (
    <main className="site-page">
      <span className="site-kicker">Legal</span>
      <h1>Terms of service</h1>
      <p>
        afterservice gives local service operators tools to manage customers,
        completed jobs, follow-ups, templates, manual outreach logs, and
        subscription billing.
      </p>
      <p>
        Operators are responsible for accurate customer records, lawful consent
        for any outreach, and keeping workspace access limited to authorized
        team members.
      </p>
      <a href="/signup">Start setup</a>
      <p className="site-note">
        This placeholder is for MVP readiness and should be reviewed by counsel
        before public launch of {appMetadata.name}.
      </p>
    </main>
  );
}
