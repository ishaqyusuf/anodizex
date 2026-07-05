"use client";

import { Badge, Button } from "@anodizex/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type Project = {
  clientName: string;
  coverImageUrl: string;
  description: string;
  location: string;
  log: string;
  media: Array<{
    alt: string;
    caption: string;
    id: string;
    mediaType: string;
    url: string;
  }>;
  serviceType: string;
  slug: string;
  summary: string;
  title: string;
  year: number;
};

export function ProjectPageContent({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.website.getProject.queryOptions({ slug }),
  );
  const project = data.item as Project | null;

  if (!project) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <h1 className="text-4xl font-semibold tracking-normal">
          Project not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The requested Anodizex project could not be found.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <a href="/#roadmap">Back to roadmap</a>
        </Button>
      </section>
    );
  }

  const logItems = project.log
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return (
    <article>
      <section className="relative min-h-[58svh] overflow-hidden">
        {project.coverImageUrl ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: CMS media URLs are external and not configured for next/image optimization yet. */}
            <img
              src={project.coverImageUrl}
              alt={project.title}
              className="absolute inset-0 size-full object-cover"
            />
          </>
        ) : null}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto flex min-h-[58svh] max-w-7xl flex-col justify-end px-5 py-14 text-white sm:px-8">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">{project.year}</Badge>
            {project.serviceType ? (
              <Badge variant="secondary">{project.serviceType}</Badge>
            ) : null}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-normal sm:text-6xl">
            {project.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/78">
            {project.summary}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium">{project.location || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium">
              {project.clientName || "Project client"}
            </p>
          </div>
          <Button asChild variant="outline">
            <a href="/#roadmap">Back to roadmap</a>
          </Button>
        </aside>

        <div className="flex flex-col gap-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">
              Project information
            </h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted-foreground">
              {project.description || project.summary}
            </p>
          </div>

          {logItems.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold tracking-normal">
                Project log
              </h2>
              <ol className="mt-5 grid gap-3">
                {logItems.map((entry, index) => (
                  <li
                    key={entry}
                    className="grid grid-cols-[2.5rem_1fr] items-start gap-4"
                  >
                    <span className="flex size-10 items-center justify-center border border-border bg-card text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="pt-2 text-muted-foreground">{entry}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {project.media.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold tracking-normal">Media</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {project.media.map((item) => (
                  <figure
                    key={item.id}
                    className="overflow-hidden border border-border bg-card"
                  >
                    <div className="aspect-[4/3] bg-muted">
                      {item.mediaType === "video" ? (
                        <>
                          {/* biome-ignore lint/a11y/useMediaCaption: CMS videos do not provide caption tracks yet. */}
                          <video
                            src={item.url}
                            controls
                            className="size-full object-cover"
                          />
                        </>
                      ) : (
                        <>
                          {/* biome-ignore lint/performance/noImgElement: CMS media URLs are external and not configured for next/image optimization yet. */}
                          <img
                            src={item.url}
                            alt={item.alt || project.title}
                            className="size-full object-cover"
                          />
                        </>
                      )}
                    </div>
                    {item.caption ? (
                      <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </article>
  );
}
