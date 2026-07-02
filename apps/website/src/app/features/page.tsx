import type { Metadata } from "next";
import { JsonLd } from "../../components/json-ld";
import { breadcrumbJsonLd, createPageMetadata } from "../../lib/seo";
import { featurePages, guidePages, solutionPages } from "../../lib/seo-content";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Features | afterservice",
    description:
      "Follow-up workflows for completed jobs, customer check-ins, templates, and manual outreach logs.",
    path: "/features",
  });
}

export default async function FeaturesPage() {
  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
        ])}
      />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#009b98]">
          Product
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#18211c] dark:text-white sm:text-5xl">
          Follow-up workflows for the work that already happened.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          Keep completed jobs, customer check-ins, issue recovery, review
          requests, templates, and outreach history in one manual-first
          workspace.
        </p>
        <a
          href="/signup"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-[#009b98] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#007f7c]"
        >
          Join Free Beta
        </a>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            Core workflow
          </h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {featurePages.map((page) => (
              <a
                className="grid gap-3 py-6 transition-colors hover:text-[#009b98] md:grid-cols-[16rem_1fr] md:gap-8"
                href={page.path}
                key={page.path}
              >
                <h3 className="font-semibold">
                  {page.title.replace(" | afterservice", "")}
                </h3>
                <p className="leading-7 text-muted-foreground">
                  {page.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
          Built around real service teams
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {solutionPages.map((page) => (
            <a href={page.path} key={page.path}>
              <h3 className="font-semibold text-foreground">{page.audience}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">
                {page.description}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            Practical guides
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {guidePages.map((page) => (
              <a href={page.path} key={page.path}>
                <h3 className="font-semibold text-foreground">
                  {page.title.replace(" | afterservice", "")}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {page.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
