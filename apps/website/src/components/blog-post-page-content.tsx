"use client";

import { Badge, Button } from "@anodizex/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type BlogPost = {
  authorName: string;
  content: string;
  coverImageUrl: string;
  excerpt: string;
  publishedAt: string | null;
  slug: string;
  title: string;
};

export function BlogPostPageContent({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.website.getBlogPost.queryOptions({ slug }),
  );
  const post = data.item as BlogPost | null;

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <h1 className="text-4xl font-semibold tracking-normal">
          Post not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The requested Anodizex blog post could not be found.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <a href="/#blog">Back to blog</a>
        </Button>
      </section>
    );
  }

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
            {/* biome-ignore lint/performance/noImgElement: CMS media URLs are external and not configured for next/image optimization yet. */}
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
