import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectPageContent } from "@/components/project-page-content";
import { createPageMetadata } from "@/lib/seo";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

type Project = {
  summary: string;
  title: string;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getQueryClient().fetchQuery(
    trpc.website.getProject.queryOptions({ slug }),
  );

  if (!item) {
    return createPageMetadata({
      noIndex: true,
      title: "Project not found | Anodizex",
      description: "The requested Anodizex project could not be found.",
      path: `/projects/${slug}`,
    });
  }

  const project = item as Project;

  return createPageMetadata({
    title: `${project.title} | Anodizex project`,
    description: project.summary,
    path: `/projects/${slug}`,
  });
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;

  await prefetch(trpc.website.getProject.queryOptions({ slug }));

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <ProjectPageContent slug={slug} />
      </Suspense>
    </HydrateClient>
  );
}
