"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@anodizex/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { ContactForm } from "./contact-form";
import type { LandingPageContent } from "./launched";

export function ContactPageContent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.website.getLanding.queryOptions());
  const content = data.item as LandingPageContent;
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
