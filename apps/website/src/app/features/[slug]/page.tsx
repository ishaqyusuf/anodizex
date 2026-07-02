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
  featurePages,
  getFeaturePage,
  solutionPages,
} from "../../../lib/seo-content";

type FeaturePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return featurePages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getFeaturePage(slug);

  if (!page) return {};

  return createPageMetadata({
    description: page.description,
    path: page.path,
    title: page.title,
  });
}

export default async function FeatureDetailPage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const page = getFeaturePage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Features", path: "/features" },
            { name: page.title, path: page.path },
          ]),
          faqJsonLd(page.faqs),
        ]}
      />
      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#009b98]">
          Feature
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#18211c] dark:text-white sm:text-5xl">
          {page.title.replace(" | afterservice", "")}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {page.description}
        </p>
        <div className="mt-10 grid gap-4">
          {page.highlights.map((highlight) => (
            <div
              className="rounded-lg border border-border bg-card p-5 leading-7 text-muted-foreground"
              key={highlight}
            >
              {highlight}
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
            Read the checklist
          </a>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            How the workflow works
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-2">
            {page.workflow.map((step, index) => (
              <li className="flex gap-4" key={step}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#009b98] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 leading-7 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
          Practical operating notes
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {page.practicalNotes.map((note) => (
            <div key={note.title}>
              <h3 className="font-semibold text-foreground">{note.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">
                {note.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <SeoFaq items={page.faqs} />

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#18211c] dark:text-white">
            Common service teams
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
