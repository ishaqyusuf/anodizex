import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../components/json-ld";
import { SeoFaq } from "../../../components/seo-faq";
import {
  breadcrumbJsonLd,
  createPageMetadata,
  faqJsonLd,
} from "../../../lib/seo";
import {
  getSolutionPage,
  guidePages,
  solutionPages,
} from "../../../lib/seo-content";

type SolutionPageProps = {
  params: Promise<{
    segment: string;
  }>;
};

export function generateStaticParams() {
  return solutionPages.map((page) => ({
    segment: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: SolutionPageProps): Promise<Metadata> {
  const { segment } = await params;
  const page = getSolutionPage(segment);

  if (!page) return {};

  return createPageMetadata({
    description: page.description,
    path: page.path,
    title: page.title,
  });
}

export default async function SolutionPage({ params }: SolutionPageProps) {
  const { segment } = await params;
  const page = getSolutionPage(segment);

  if (!page) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/features" },
            { name: page.audience, path: page.path },
          ]),
          faqJsonLd(page.faqs),
        ]}
      />
      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#009b98]">
          {page.audience}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-[#18211c] dark:text-white sm:text-5xl">
          {page.hero}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          {page.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#009b98] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#007f7c]"
          >
            Join Free Beta
          </a>
          <a
            href="/guides/post-job-follow-up"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Read the follow-up checklist
          </a>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
              Why follow-up breaks
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">{page.pain}</p>
          </div>
          <div className="grid gap-3">
            {page.outcomes.map((outcome) => (
              <div
                className="rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground"
                key={outcome}
              >
                {outcome}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
          A manual-first workflow your team can repeat
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {page.workflows.map((workflow, index) => (
            <div
              className="rounded-lg border border-border bg-card p-5"
              key={workflow}
            >
              <span className="text-sm font-semibold text-[#009b98]">
                Step {index + 1}
              </span>
              <p className="mt-3 leading-7 text-muted-foreground">{workflow}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            A practical follow-up cadence
          </h2>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {page.cadence.map((item) => (
              <div
                className="grid gap-3 py-6 md:grid-cols-[14rem_1fr] md:gap-8"
                key={item.timing}
              >
                <h3 className="font-semibold text-foreground">{item.timing}</h3>
                <p className="leading-7 text-muted-foreground">{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeoFaq items={page.faqs} />

      <section className="mx-auto max-w-5xl px-6 pb-20 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
          Related guides
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {guidePages.map((guide) => (
            <a
              className="rounded-lg border border-border p-5 transition-colors hover:bg-muted"
              href={guide.path}
              key={guide.path}
            >
              <h3 className="font-semibold text-foreground">{guide.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {guide.description}
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
