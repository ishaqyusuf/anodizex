import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@anodizex/ui";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import type { LandingPageContent } from "@/components/launched";
import { createPageMetadata } from "@/lib/seo";
import { getQueryClient, trpc } from "@/trpc/server";

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: "Contact Anodizex | Aluminium project enquiries",
    description:
      "Contact Anodizex for aluminium windows, sliding systems, doors, facades, and architectural aluminium project support.",
    path: "/contact",
  });
}

export default async function ContactPage() {
  const content = (
    await getQueryClient().fetchQuery(trpc.website.getLanding.queryOptions())
  ).item as LandingPageContent;
  const { settings } = content;
  const address = [
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.region,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-background">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Contact
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
            Tell us about your aluminium project
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Send the project description, location, and systems you need. The
            admin receives an email, and you receive a confirmation email at the
            address you provide.
          </p>

          <div className="mt-8 grid gap-4 text-sm text-muted-foreground">
            <div>
              <div className="font-medium text-foreground">Email</div>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </div>
            <div>
              <div className="font-medium text-foreground">Phone</div>
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            </div>
            <div>
              <div className="font-medium text-foreground">Address</div>
              <p>{address}</p>
            </div>
            <div>
              <div className="font-medium text-foreground">Office hours</div>
              <p>{settings.officeHours}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project enquiry</CardTitle>
            <CardDescription>
              Add enough context for the sales or project team to follow up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
