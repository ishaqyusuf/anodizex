import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogPostPageContent } from "@/components/blog-post-page-content";
import { createPageMetadata } from "@/lib/seo";
import { getQueryClient, HydrateClient, prefetch, trpc } from "@/trpc/server";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

type BlogPost = {
  excerpt: string;
  title: string;
};

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getQueryClient().fetchQuery(
    trpc.website.getBlogPost.queryOptions({ slug }),
  );

  if (!item) {
    return createPageMetadata({
      noIndex: true,
      title: "Post not found | Anodizex",
      description: "The requested Anodizex blog post could not be found.",
      path: `/blog/${slug}`,
    });
  }

  const post = item as BlogPost;

  return createPageMetadata({
    title: `${post.title} | Anodizex`,
    description: post.excerpt,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;

  await prefetch(trpc.website.getBlogPost.queryOptions({ slug }));

  return (
    <HydrateClient>
      <Suspense fallback={null}>
        <BlogPostPageContent slug={slug} />
      </Suspense>
    </HydrateClient>
  );
}
