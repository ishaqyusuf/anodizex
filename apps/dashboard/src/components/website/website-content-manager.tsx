"use client";

import type { AppRouter } from "@anodizex/api/router";
import {
  createBlogPostSchema,
  createGalleryItemSchema,
  createProjectMediaSchema,
  createWebsiteProjectSchema,
  updateGalleryItemSchema,
  websiteSettingsSchema,
} from "@anodizex/api/schemas";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { upload } from "@vercel/blob/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { ArrowDown, ArrowUp, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type WebsiteContent =
  inferRouterOutputs<AppRouter>["website"]["admin"]["getContent"]["item"];
type Project = WebsiteContent["projects"][number];
type GalleryItem = WebsiteContent["gallery"][number];

const mediaTypeOptions = [
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
] as const;
const emptyProjectValue = "__none";

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function WebsiteContentManager() {
  const trpc = useTRPC();
  const { data, isPending } = useQuery(
    trpc.website.admin.getContent.queryOptions(),
  );

  if (isPending) {
    return <WebsiteContentSkeleton />;
  }

  if (!data?.item) {
    return (
      <Alert>
        <AlertTitle>Website content unavailable</AlertTitle>
        <AlertDescription>
          Reload the page or check that your workspace is active.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="contact" className="flex flex-col gap-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
        <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
      </TabsList>

      <TabsContent value="contact">
        <WebsiteSettingsForm settings={data.item.settings} />
      </TabsContent>
      <TabsContent value="gallery">
        <GalleryManager
          items={data.item.gallery}
          projects={data.item.projects}
        />
      </TabsContent>
      <TabsContent value="roadmap">
        <ProjectManager projects={data.item.projects} />
      </TabsContent>
      <TabsContent value="blog">
        <BlogManager posts={data.item.blogPosts} />
      </TabsContent>
      <TabsContent value="inquiries">
        <InquiriesPanel inquiries={data.item.inquiries} />
      </TabsContent>
    </Tabs>
  );
}

function WebsiteSettingsForm({
  settings,
}: {
  settings: WebsiteContent["settings"];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useZodForm({
    schema: websiteSettingsSchema,
    defaultValues: {
      addressLine1: settings.addressLine1,
      addressLine2: settings.addressLine2,
      city: settings.city,
      companyName: settings.companyName,
      country: settings.country,
      description: settings.description,
      email: settings.email,
      headline: settings.headline,
      heroImageUrl: settings.heroImageUrl,
      instagramUrl: settings.instagramUrl,
      linkedinUrl: settings.linkedinUrl,
      mapUrl: settings.mapUrl,
      officeHours: settings.officeHours,
      phone: settings.phone,
      region: settings.region,
      whatsappUrl: settings.whatsappUrl,
    },
  });
  const mutation = useMutation(
    trpc.website.admin.updateSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.website.admin.getContent.queryKey(),
        });
      },
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website contact information</CardTitle>
        <CardDescription>
          This controls the public address, email, phone, office hours, and hero
          copy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField control={form.control} name="companyName" label="Company name" />
              <TextField control={form.control} name="email" label="Admin email" />
              <TextField control={form.control} name="phone" label="Phone" />
              <TextField control={form.control} name="officeHours" label="Office hours" />
            </div>
            <TextField control={form.control} name="headline" label="Hero headline" />
            <LongTextField control={form.control} name="description" label="Description" />
            <TextField control={form.control} name="heroImageUrl" label="Hero image URL" />
            <div className="grid gap-5 md:grid-cols-2">
              <TextField control={form.control} name="addressLine1" label="Address line 1" />
              <TextField control={form.control} name="addressLine2" label="Address line 2" />
              <TextField control={form.control} name="city" label="City" />
              <TextField control={form.control} name="region" label="Region" />
              <TextField control={form.control} name="country" label="Country" />
              <TextField control={form.control} name="mapUrl" label="Map URL" />
              <TextField control={form.control} name="whatsappUrl" label="WhatsApp URL" />
              <TextField control={form.control} name="instagramUrl" label="Instagram URL" />
              <TextField control={form.control} name="linkedinUrl" label="LinkedIn URL" />
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save contact information"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function GalleryManager({
  items,
  projects,
}: {
  items: GalleryItem[];
  projects: Project[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useZodForm({
    schema: createGalleryItemSchema,
    defaultValues: {
      alt: "",
      description: "",
      isFeatured: true,
      mediaType: "image",
      projectId: "",
      tags: "",
      capturedAt: "",
      thumbnailUrl: "",
      title: "",
      url: "",
    },
  });
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.website.admin.getContent.queryKey(),
    });
  const createMutation = useMutation(
    trpc.website.admin.createGalleryItem.mutationOptions({
      onSuccess: () => {
        form.reset();
        invalidate();
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.website.admin.deleteGalleryItem.mutationOptions({
      onSuccess: invalidate,
    }),
  );
  const reorderMutation = useMutation(
    trpc.website.admin.reorderGallery.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add gallery item</CardTitle>
          <CardDescription>
            Upload to Vercel Blob when configured, or paste an external image or
            video URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="flex flex-col gap-5"
            >
              <BlobUploadField
                kind="gallery"
                onUploaded={(url) =>
                  form.setValue("url", url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <TextField control={form.control} name="title" label="Title" />
              <LongTextField
                control={form.control}
                name="description"
                label="Description"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextField control={form.control} name="tags" label="Tags" />
                <TextField
                  control={form.control}
                  name="capturedAt"
                  label="Media date"
                  type="date"
                />
              </div>
              <TextField control={form.control} name="url" label="Media URL" />
              <TextField control={form.control} name="thumbnailUrl" label="Thumbnail URL" />
              <TextField control={form.control} name="alt" label="Alt text" />
              <CheckboxField
                control={form.control}
                name="isFeatured"
                label="Show in public gallery"
              />
              <FormField
                control={form.control}
                name="mediaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Media type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select media type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {mediaTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ProjectSelect
                control={form.control}
                name="projectId"
                projects={projects}
              />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add to gallery"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery catalog</CardTitle>
          <CardDescription>
            Edit imported Telegram media, then move items up or down to control
            the public gallery order.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No gallery items yet.</p>
          ) : (
            items.map((item, index) => (
              <GalleryItemEditor
                key={item.id}
                item={item}
                projects={projects}
                canMoveDown={index < items.length - 1}
                canMoveUp={index > 0}
                onDelete={() => deleteMutation.mutate({ id: item.id })}
                onMove={(direction) => {
                  const nextItems = [...items];
                  const [moved] = nextItems.splice(index, 1);
                  if (!moved) return;
                  nextItems.splice(index + direction, 0, moved);
                  reorderMutation.mutate({
                    ids: nextItems.map((nextItem) => nextItem.id),
                  });
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GalleryItemEditor({
  canMoveDown,
  canMoveUp,
  item,
  onDelete,
  onMove,
  projects,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  item: GalleryItem;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  projects: Project[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useZodForm({
    schema: updateGalleryItemSchema,
    defaultValues: {
      alt: item.alt,
      capturedAt: dateInputValue(item.capturedAt),
      description: item.description,
      id: item.id,
      isFeatured: item.isFeatured,
      mediaType: item.mediaType as "image" | "video",
      projectId: item.projectId,
      tags: item.tags.join(", "),
      thumbnailUrl: item.thumbnailUrl,
      title: item.title,
      url: item.url,
    },
  });
  const mutation = useMutation(
    trpc.website.admin.updateGalleryItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.website.admin.getContent.queryKey(),
        });
      },
    }),
  );

  return (
    <div className="border border-border p-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate({ ...values, id: item.id }),
          )}
          className="grid gap-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {item.sourceProvider === "telegram"
                  ? "Imported from Telegram"
                  : "Manual gallery item"}
                {item.capturedAt ? ` · ${dateInputValue(item.capturedAt)}` : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!canMoveUp}
                onClick={() => onMove(-1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!canMoveDown}
                onClick={() => onMove(1)}
              >
                <ArrowDown />
              </Button>
              <Button type="button" variant="destructive" onClick={onDelete}>
                Remove
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField control={form.control} name="title" label="Title" />
            <TextField control={form.control} name="tags" label="Tags" />
            <TextField
              control={form.control}
              name="capturedAt"
              label="Media date"
              type="date"
            />
            <ProjectSelect
              control={form.control}
              name="projectId"
              projects={projects}
            />
          </div>
          <LongTextField
            control={form.control}
            name="description"
            label="Caption or description"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField control={form.control} name="url" label="Media URL" />
            <TextField
              control={form.control}
              name="thumbnailUrl"
              label="Thumbnail URL"
            />
            <TextField control={form.control} name="alt" label="Alt text" />
            <FormField
              control={form.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Media type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select media type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {mediaTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <CheckboxField
            control={form.control}
            name="isFeatured"
            label="Show in public gallery"
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save gallery item"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function ProjectManager({ projects }: { projects: Project[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.website.admin.getContent.queryKey(),
    });
  const form = useZodForm({
    schema: createWebsiteProjectSchema,
    defaultValues: {
      clientName: "",
      coverImageUrl: "",
      description: "",
      location: "",
      log: "",
      serviceType: "",
      slug: "",
      status: "completed",
      summary: "",
      title: "",
      year: new Date().getFullYear(),
    },
  });
  const mediaForm = useZodForm({
    schema: createProjectMediaSchema,
    defaultValues: {
      alt: "",
      caption: "",
      mediaType: "image",
      projectId: projects[0]?.id ?? "",
      thumbnailUrl: "",
      url: "",
    },
  });
  const createMutation = useMutation(
    trpc.website.admin.createProject.mutationOptions({
      onSuccess: () => {
        form.reset();
        invalidate();
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.website.admin.deleteProject.mutationOptions({ onSuccess: invalidate }),
  );
  const reorderMutation = useMutation(
    trpc.website.admin.reorderProjects.mutationOptions({ onSuccess: invalidate }),
  );
  const createMediaMutation = useMutation(
    trpc.website.admin.createProjectMedia.mutationOptions({
      onSuccess: () => {
        mediaForm.reset({
          alt: "",
          caption: "",
          mediaType: "image",
          projectId: projects[0]?.id ?? "",
          thumbnailUrl: "",
          url: "",
        });
        invalidate();
      },
    }),
  );
  const deleteMediaMutation = useMutation(
    trpc.website.admin.deleteProjectMedia.mutationOptions({
      onSuccess: invalidate,
    }),
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add roadmap project</CardTitle>
          <CardDescription>
            Roadmap projects appear on the landing page and open into project
            detail pages with logs and media.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="flex flex-col gap-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <TextField control={form.control} name="title" label="Title" />
                <TextField control={form.control} name="year" label="Year" type="number" />
                <TextField control={form.control} name="serviceType" label="Service type" />
                <TextField control={form.control} name="location" label="Location" />
                <TextField control={form.control} name="clientName" label="Client" />
                <TextField control={form.control} name="slug" label="Slug" />
              </div>
              <BlobUploadField
                kind="project"
                onUploaded={(url) =>
                  form.setValue("coverImageUrl", url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <TextField control={form.control} name="coverImageUrl" label="Cover image URL" />
              <LongTextField control={form.control} name="summary" label="Summary" />
              <LongTextField control={form.control} name="description" label="Description" />
              <LongTextField
                control={form.control}
                name="log"
                label="Project log"
                placeholder="One log item per line"
              />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add roadmap project"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Roadmap order</CardTitle>
            <CardDescription>
              Reorder or remove completed project entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderedList
              emptyLabel="No roadmap projects yet."
              items={projects}
              getTitle={(item) => `${item.year} · ${item.title}`}
              getDescription={(item) => item.summary}
              onDelete={(item) => deleteMutation.mutate({ id: item.id })}
              onMove={(nextItems) =>
                reorderMutation.mutate({
                  ids: nextItems.map((item) => item.id),
                })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add project media</CardTitle>
            <CardDescription>
              Attach images or videos to a roadmap project page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...mediaForm}>
              <form
                onSubmit={mediaForm.handleSubmit((values) =>
                  createMediaMutation.mutate(values),
                )}
                className="flex flex-col gap-5"
              >
                <ProjectSelect
                  control={mediaForm.control}
                  name="projectId"
                  projects={projects}
                />
                <BlobUploadField
                  kind="project"
                  projectId={mediaForm.watch("projectId")}
                  onUploaded={(url) =>
                    mediaForm.setValue("url", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <TextField control={mediaForm.control} name="url" label="Media URL" />
                <TextField control={mediaForm.control} name="caption" label="Caption" />
                <TextField control={mediaForm.control} name="alt" label="Alt text" />
                <FormField
                  control={mediaForm.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select media type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {mediaTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMediaMutation.isPending}>
                  {createMediaMutation.isPending ? "Adding..." : "Add project media"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project media</CardTitle>
          <CardDescription>Remove media from project detail pages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {projects.flatMap((project) =>
            project.media.map((media) => (
              <div
                key={media.id}
                className="flex flex-col gap-3 border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">{project.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {media.caption || media.url}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMediaMutation.mutate({ id: media.id })}
                >
                  Remove
                </Button>
              </div>
            )),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BlogManager({ posts }: { posts: WebsiteContent["blogPosts"] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.website.admin.getContent.queryKey(),
    });
  const form = useZodForm({
    schema: createBlogPostSchema,
    defaultValues: {
      authorName: "Anodizex",
      content: "",
      coverImageUrl: "",
      excerpt: "",
      slug: "",
      title: "",
    },
  });
  const createMutation = useMutation(
    trpc.website.admin.createBlogPost.mutationOptions({
      onSuccess: () => {
        form.reset();
        invalidate();
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.website.admin.deleteBlogPost.mutationOptions({ onSuccess: invalidate }),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add blog post</CardTitle>
          <CardDescription>
            Blog posts appear on the landing page and open into public articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              className="flex flex-col gap-5"
            >
              <TextField control={form.control} name="title" label="Title" />
              <TextField control={form.control} name="slug" label="Slug" />
              <TextField control={form.control} name="authorName" label="Author" />
              <BlobUploadField
                kind="blog"
                onUploaded={(url) =>
                  form.setValue("coverImageUrl", url, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <TextField control={form.control} name="coverImageUrl" label="Cover image URL" />
              <LongTextField control={form.control} name="excerpt" label="Excerpt" />
              <LongTextField control={form.control} name="content" label="Content" />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish post"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published posts</CardTitle>
          <CardDescription>Remove posts from the public blog list.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium">{post.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {post.excerpt}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: post.id })}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InquiriesPanel({
  inquiries,
}: {
  inquiries: WebsiteContent["inquiries"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent contact enquiries</CardTitle>
        <CardDescription>
          The contact form stores enquiries and records admin/customer email
          delivery status.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {inquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="border border-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-medium">{inquiry.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {inquiry.email}
                    {inquiry.phone ? ` · ${inquiry.phone}` : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {inquiry.adminEmailStatus || "email pending"}
                  </Badge>
                  <Badge variant="outline">{inquiry.status}</Badge>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {inquiry.message}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function OrderedList<TItem extends { id: string }>({
  emptyLabel,
  getDescription,
  getTitle,
  items,
  onDelete,
  onMove,
}: {
  emptyLabel: string;
  getDescription: (item: TItem) => string;
  getTitle: (item: TItem) => string;
  items: TItem[];
  onDelete: (item: TItem) => void;
  onMove: (items: TItem[]) => void;
}) {
  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const nextItems = [...items];
    const [item] = nextItems.splice(index, 1);
    if (!item) return;
    nextItems.splice(nextIndex, 0, item);
    onMove(nextItems);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 border border-border p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="font-medium">{getTitle(item)}</div>
            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {getDescription(item)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown />
            </Button>
            <Button type="button" variant="destructive" onClick={() => onDelete(item)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlobUploadField({
  kind,
  onUploaded,
  projectId,
}: {
  kind: "gallery" | "project" | "blog" | "settings";
  onUploaded: (url: string) => void;
  projectId?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);

    try {
      const blob = await upload(`anodizex/${kind}/${file.name}`, file, {
        access: "public",
        clientPayload: JSON.stringify({ kind, projectId }),
        handleUploadUrl: "/api/website/blob/upload",
      });
      onUploaded(blob.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload media.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={`blob-upload-${kind}`}>
        Vercel Blob upload
      </label>
      <div className="flex items-center gap-3">
        <Input
          id={`blob-upload-${kind}`}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          disabled={isUploading}
          onChange={onFileChange}
        />
        <Upload className="text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">
        {isUploading
          ? "Uploading..."
          : "Requires BLOB_READ_WRITE_TOKEN in the dashboard environment."}
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ProjectSelect({
  control,
  name,
  projects,
}: {
  control: any;
  name: string;
  projects: Project[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project</FormLabel>
          <Select
            onValueChange={(value) =>
              field.onChange(value === emptyProjectValue ? "" : value)
            }
            value={field.value || emptyProjectValue}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptyProjectValue}>No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxField({
  control,
  label,
  name,
}: {
  control: any;
  label: string;
  name: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Input
              type="checkbox"
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              className="size-4"
            />
          </FormControl>
          <FormLabel className="text-sm font-medium">{label}</FormLabel>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextField({
  control,
  label,
  name,
  placeholder,
  type = "text",
}: {
  control: any;
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LongTextField({
  control,
  label,
  name,
  placeholder,
}: {
  control: any;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea className="min-h-28" placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function WebsiteContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
