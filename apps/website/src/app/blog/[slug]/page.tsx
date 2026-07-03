import { Badge, Button } from "@anodizex/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";
import { getWebsiteCaller } from "@/lib/server-trpc";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

type BlogPost = {
  authorName: string;
  content: string;
  coverImageUrl: string;
  excerpt: string;
  publishedAt: string | null;
  slug: string;
  title: string;
};

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getWebsiteCaller();
  const { item } = await caller.website.getBlogPost({ slug });

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
  const caller = await getWebsiteCaller();
  const { item } = await caller.website.getBlogPost({ slug });

  if (!item) notFound();

  const post = item as BlogPost;

  return (
    <article>
      <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
        <Badge variant="secondary">Anodizex blog</Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-5 text-sm text-muted-foreground">
          {post.authorName}
          {post.publishedAt
            ? ` · ${new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
              }).format(new Date(post.publishedAt))}`
            : null}
        </div>
      </section>

      {post.coverImageUrl ? (
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="aspect-[16/8] overflow-hidden bg-muted">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="size-full object-cover"
            />
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        <div className="whitespace-pre-line text-base leading-8 text-muted-foreground">
          {post.content}
        </div>
        <Button asChild variant="outline" className="mt-10">
          <a href="/#blog">Back to blog</a>
        </Button>
      </section>
    </article>
  );
}
