import {
  Badge,
  BrandLogo,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@anodizex/ui";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  Mail,
  MapPin,
  Menu,
  Phone,
  SquareStack,
  X,
} from "lucide-react";
import { ContactForm } from "./contact-form";

export type LandingPageContent = {
  settings: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    companyName: string;
    country: string;
    description: string;
    email: string;
    headline: string;
    heroImageUrl: string;
    officeHours: string;
    phone: string;
    region: string;
  };
  gallery: Array<{
    alt: string;
    description: string;
    id: string;
    mediaType: string;
    title: string;
    url: string;
  }>;
  projects: Array<{
    coverImageUrl: string;
    id: string;
    location: string;
    serviceType: string;
    slug: string;
    summary: string;
    title: string;
    year: number;
  }>;
  blogPosts: Array<{
    coverImageUrl: string;
    excerpt: string;
    id: string;
    slug: string;
    title: string;
  }>;
};

const systemCards = [
  {
    description:
      "Slim, durable frames for residential and commercial openings with clean sightlines.",
    icon: SquareStack,
    title: "Windows",
  },
  {
    description:
      "Large aluminium sliding and folding systems for terraces, balconies, and open-plan spaces.",
    icon: DoorOpen,
    title: "Sliding Systems",
  },
  {
    description:
      "Entrance, storefront, and internal aluminium door packages for reliable everyday use.",
    icon: DoorOpen,
    title: "Doors",
  },
  {
    description:
      "Curtain wall, shopfront, and facade framing coordinated for project teams.",
    icon: Building2,
    title: "Facades",
  },
] as const;

type LaunchedPageProps = {
  content: LandingPageContent;
};

export function LaunchedPage({ content }: LaunchedPageProps) {
  const { settings } = content;
  const heroImage =
    settings.heroImageUrl ||
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/15 bg-black/45 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="text-white">
            <BrandLogo name={settings.companyName || "Anodizex"} />
          </a>

          <nav
            aria-label="Landing navigation"
            className="hidden items-center gap-7 text-sm font-medium text-white/78 md:flex"
          >
            <a href="#systems" className="transition-colors hover:text-white">
              Systems
            </a>
            <a href="#roadmap" className="transition-colors hover:text-white">
              Roadmap
            </a>
            <a href="#gallery" className="transition-colors hover:text-white">
              Gallery
            </a>
            <a href="#blog" className="transition-colors hover:text-white">
              Blog
            </a>
            <a href="/contact" className="transition-colors hover:text-white">
              Contact
            </a>
          </nav>

          <Button asChild className="hidden md:inline-flex">
            <a href="#contact">
              Start a project
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>

          <details className="group md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center border border-white/20 text-white">
              <Menu className="block group-open:hidden" />
              <X className="hidden group-open:block" />
            </summary>
            <div className="absolute left-4 right-4 top-16 flex flex-col gap-1 border border-white/15 bg-black/90 p-4 text-sm font-medium text-white">
              <a href="#systems" className="px-3 py-2">
                Systems
              </a>
              <a href="#roadmap" className="px-3 py-2">
                Roadmap
              </a>
              <a href="#gallery" className="px-3 py-2">
                Gallery
              </a>
              <a href="#blog" className="px-3 py-2">
                Blog
              </a>
              <a href="/contact" className="px-3 py-2">
                Contact
              </a>
            </div>
          </details>
        </div>
      </header>

      <section className="relative flex min-h-[88svh] items-end overflow-hidden">
        <img
          src={heroImage}
          alt="Modern aluminium architectural glazing"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-black/72" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/24 to-black/0" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-5 pb-12 pt-28 text-white sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl">
            <Badge variant="secondary">Windows, doors, sliders, facades</Badge>
            <h1 className="mt-5 text-5xl font-semibold tracking-normal sm:text-7xl">
              {settings.companyName || "Anodizex"}
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-white/84 sm:text-2xl">
              {settings.headline}
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
              {settings.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#contact">
                  Request consultation
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#roadmap">View completed work</a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-white/82 sm:grid-cols-4 lg:grid-cols-2">
            {[
              ["12+", "system types"],
              ["4", "project categories"],
              ["2024-2026", "roadmap"],
              ["Blob-ready", "media library"],
            ].map(([value, label]) => (
              <div key={label} className="border border-white/18 bg-white/10 p-4">
                <div className="text-2xl font-semibold text-white">{value}</div>
                <div className="mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main>
        <section id="systems" className="border-b border-border py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Systems"
              title="Aluminium packages for openings and envelopes"
              description="Plan windows, doors, sliding systems, and facades from one coordinated aluminium partner."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {systemCards.map((item) => (
                <Card key={item.title}>
                  <CardHeader>
                    <item.icon className="mb-4 text-primary" />
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap" className="border-b border-border py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Roadmap"
              title="Completed project timeline"
              description="Roadmap entries are completed work across the years. Open each project to see its log, images, and media."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {content.projects.map((project) => (
                <a
                  href={`/projects/${project.slug}`}
                  key={project.id}
                  className="group block overflow-hidden border border-border bg-card transition-colors hover:border-primary"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {project.coverImageUrl ? (
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-4 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <Badge variant="outline">{project.year}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {project.serviceType}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {project.summary}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Open project
                      <ArrowRight />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="gallery" className="border-b border-border py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Gallery"
              title="A working media library for products and projects"
              description="The dashboard can add, remove, and reorder gallery items. Images can use external URLs today or Vercel Blob uploads when configured."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.gallery.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden border border-border bg-card"
                >
                  <div className="aspect-[4/3] bg-muted">
                    {item.mediaType === "video" ? (
                      <video
                        src={item.url}
                        className="size-full object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.alt || item.title}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <figcaption className="p-5">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="blog" className="border-b border-border py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Blog"
              title="Notes for clients and project teams"
              description="Use the blog area for planning guides, project notes, aluminium system explainers, and maintenance advice."
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {content.blogPosts.map((post) => (
                <Card key={post.id}>
                  {post.coverImageUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : null}
                  <CardHeader>
                    <CardTitle>{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline">
                      <a href={`/blog/${post.slug}`}>Read post</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHeading
                eyebrow="Contact"
                title="Talk to Anodizex about your next opening schedule"
                description="Send project details and the admin will receive an email. You will receive a confirmation on the email you provide."
              />
              <div className="mt-8 flex flex-col gap-4 text-sm text-muted-foreground">
                <ContactLine icon={Mail} value={settings.email} />
                <ContactLine icon={Phone} value={settings.phone} />
                <ContactLine
                  icon={MapPin}
                  value={[
                    settings.addressLine1,
                    settings.addressLine2,
                    settings.city,
                    settings.region,
                    settings.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Request project support</CardTitle>
                <CardDescription>
                  Share the project stage, location, and aluminium systems you
                  need.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 text-sm text-muted-foreground sm:px-8 md:flex-row md:items-center md:justify-between">
          <BrandLogo name={settings.companyName || "Anodizex"} />
          <div className="flex flex-wrap gap-5">
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-normal text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  value,
}: {
  icon: typeof Mail;
  value: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 text-primary" />
      <span>{value}</span>
    </div>
  );
}
