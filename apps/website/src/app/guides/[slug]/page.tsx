import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../components/json-ld";
import { SeoFaq } from "../../../components/seo-faq";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  createPageMetadata,
  faqJsonLd,
} from "../../../lib/seo";
import {
  getGuidePage,
  guidePages,
  solutionPages,
} from "../../../lib/seo-content";

type GuidePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return guidePages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getGuidePage(slug);

  if (!page) return {};

  return createPageMetadata({
    description: page.description,
    path: page.path,
    title: page.title,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const page = getGuidePage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={[
          articleJsonLd({
            description: page.description,
            path: page.path,
            title: page.title,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/features" },
            { name: page.title, path: page.path },
          ]),
          faqJsonLd(page.faqs),
        ]}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#009b98]">
          afterservice guide
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#18211c] dark:text-white sm:text-5xl">
          {page.title.replace(" | afterservice", "")}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {page.intro}
        </p>

        <div className="mt-12 space-y-10">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 leading-8 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.checklist && (
                <ul className="mt-5 list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                  {section.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.example && (
                <div className="mt-5 border-l-2 border-[#009b98] bg-muted/40 px-5 py-4">
                  <p className="text-sm font-semibold text-foreground">
                    Example
                  </p>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {section.example}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-muted/40 p-6">
          <h2 className="text-xl font-semibold text-[#18211c] dark:text-white">
            Put the checklist into a board
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            afterservice is in free beta for local service operators who want a
            simple, manual-first way to manage post-job follow-up.
          </p>
          <a
            href="/signup"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#009b98] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#007f7c]"
          >
            Join Free Beta
          </a>
        </div>
      </article>

      <SeoFaq items={page.faqs} />

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            Built for service operators
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {solutionPages.map((solution) => (
              <a
                className="rounded-lg border border-border bg-background p-4 text-sm font-semibold transition-colors hover:bg-muted"
                href={solution.path}
                key={solution.path}
              >
                {solution.audience}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
