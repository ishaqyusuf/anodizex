import { Card, CardContent, CardHeader, CardTitle } from "@anodizex/ui";
import {
  CalendarCheck,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

export function LandingFeatures() {
  const features = [
    {
      title: "Post-Job Follow-Up Board",
      description:
        "See every open, scheduled, sent, replied, missed, and closed follow-up in one operator-friendly board.",
      icon: <CalendarCheck className="w-6 h-6" />,
    },
    {
      title: "Review-Safe Requests",
      description:
        "Ask every customer for honest feedback and keep public-review prompts separate from issue recovery.",
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      title: "Issue Recovery Workflow",
      description:
        "Track callbacks, concerns, warranty checks, and unresolved promises before they disappear into memory.",
      icon: <ShieldAlert className="w-6 h-6" />,
    },
    {
      title: "Repeat Visit Reminders",
      description:
        "Schedule smart seasonal maintenance alerts, follow-up inspection prompts, or warranty checks based on the job completed.",
      icon: <RefreshCw className="w-6 h-6" />,
    },
    {
      title: "Team Ownership",
      description:
        "Assign follow-ups to the owner, admin, or staff member who should close the loop with the customer.",
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: "Workspace Security",
      description:
        "Role-based workspace scopes protect customer data. Secure authentication keeps your client list locked down.",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
  ];

  return (
    <section
      id="features"
      className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-8 py-24"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
          Built for Local Service Experts
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          A manual-first workflow for the customer moments that happen after a
          repair, install, appointment, or service visit is complete.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="hover:border-[#009b98]/40 shadow-sm dark:shadow-none transition-all duration-300 group bg-card"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
