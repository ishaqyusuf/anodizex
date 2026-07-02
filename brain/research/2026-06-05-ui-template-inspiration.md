# UI Template Inspiration Research

Date: 2026-06-05

## Context

afterservice is an operations tool for local businesses that need reliable, repeatable customer follow-up after work is completed. This reference list is for landing page, onboarding, dashboard, and related app shell work.

The product brain still points the UI toward practical operator clarity: manual workflows first, one board for after-service work, honest beta positioning, and fast scannable screens over decorative SaaS theater.

## Recommended Direction

- Landing page: show the follow-up board/product workflow in the first viewport. Use a plain operator story: completed job, due follow-up, customer response, review request, issue follow-up, next service reminder.
- Onboarding: use a short setup flow plus a getting-started checklist. The first useful action should be creating a workspace and one follow-up, not watching a product tour.
- Dashboard: prioritize board/list/table patterns, due states, customer/job context, and side panels. Use charts sparingly for trust and workload, not as the main interface.
- Mobile: design for quick triage and CTA clarity; use compact sticky beta CTA patterns only when they do not cover core content.
- Styling: keep Tailwind-oriented implementation references because project rules require Tailwind CSS for UI components.

## Landing Page References

- Dribbble field service management search: https://dribbble.com/search/field%20service%20management
  - Good for job scheduling, work-order, field service, and operations SaaS visual motifs.
  - Borrow: product screenshot prominence, workflow vocabulary, board/list views.
  - Avoid: generic glossy enterprise promises that do not match the beta product.
- Dribbble customer support tag: https://dribbble.com/tags/customer-support
  - Good for support, ticket, chat, and customer-response layouts.
  - Borrow: customer issue cards, reply states, inbox/detail split layouts.
  - Avoid: AI-first helpdesk positioning unless the feature actually exists.
- Landingfolio: https://www.landingfolio.com/
  - Curated landing pages with SaaS, product, business, CRM, and software categories.
  - Borrow: section sequencing and product-proof balance.
- SaaSFrame landing pages: https://www.saasframe.io/categories/landing-page
  - Useful for comparing real SaaS landing sections, CTAs, pricing, early-access pages, and product previews.
  - Borrow: compact hero plus product UI preview and clear use-case bands.
- WebInspoo: https://www.webinspoo.com/
  - Useful for filtered SaaS website references by category, font, palette, and stack.
  - Borrow: restrained SaaS typography and real screenshots.

## Onboarding References

- Dribbble SaaS onboarding UI search: https://dribbble.com/search/saas%20onboarding%20ui
  - Good for multi-step setup, business verification, checklist, and CRM onboarding shots.
  - Borrow: concise business setup screens and progress indicators.
- Page Flows web onboarding: https://pageflows.com/web/flows/onboarding/
  - Real product onboarding flows and screen sequences.
  - Borrow: flow-level pacing and first-value moments.
- SaaS Interface onboarding examples: https://saasinterface.com/pages/onboarding/
  - SaaS onboarding gallery focused on product page patterns.
  - Borrow: checklist-first and empty-state guidance patterns.
- SaaSFrame user onboarding: https://www.saasframe.io/
  - Use the User Onboarding and Account Setup categories for setup states, invite/team setup, and welcome steps.

## Dashboard / App Shell References

- Dribbble support dashboard search: https://dribbble.com/search/support-dashboard
  - Good for support queue, customer-response, and omnichannel dashboard patterns.
  - Borrow: queue states, SLA/due indicators, and detail panels.
- SaaS Interface: https://saasinterface.com/
  - Product UI categories include Dashboard, Lists & Tables, Boards, Messaging & Chat, Onboarding, Empty State, Side Panel, Filters, and Bulk Actions.
  - Borrow: app shell, table density, filtering, side panels, and empty states.
- SaaSFrame: https://www.saasframe.io/
  - Product categories include Dashboard, Add & Edit, Account Setup, and User Onboarding.
  - Borrow: CRUD flows and setup/account patterns.
- Figma dashboard templates: https://www.figma.com/templates/dashboard-designs/
  - Free dashboard design templates and components, including CRM/customer list and admin dashboard patterns.
  - Borrow: table structure, stats hierarchy, reusable components.

## Tailwind / Buildable Template References

- TailAdmin: https://tailadmin.com/
  - Open-source Tailwind dashboard template with React, Next.js, Vue, Angular, Laravel, and HTML support.
  - Borrow: app shell, page inventory, settings/billing/admin surfaces.
- Mosaic Lite by Cruip: https://github.com/cruip/tailwind-dashboard-template
  - Free React dashboard built with Tailwind CSS and updated for Tailwind v4.
  - Borrow: sidebar shell, charts, responsive dashboard structure.
- Preline dashboard templates: https://preline.co/templates/dashboards/
  - Tailwind dashboard/admin templates with CRM, incidents, survey, and analytics demos.
  - Borrow: CRM/task/pipeline layouts and framework-agnostic Tailwind patterns.
- DashboardPack SaaS templates: https://dashboardpack.com/templates/saas/
  - SaaS admin dashboard templates with user onboarding, role access, billing, and customer success metrics.
  - Borrow: billing/settings/admin page coverage; avoid heavy analytics as the default dashboard mental model.
- ShadcnStore templates: https://shadcnstore.com/templates
  - shadcn, Next.js, TypeScript, and Tailwind template reference.
  - Borrow: component quality and accessibility direction if shadcn-style components are added.

## afterservice-Specific Composition Notes

Landing page first viewport:
- Brand signal: afterservice.
- H1 direction: "One board for every customer follow-up after the job."
- Visual: board mock or real screenshot with columns such as Due today, Waiting, Replied, Closed.
- CTA: "Join the beta" / "Start free, no card required."
- Trust strip: "Built for local operators", "Email-first follow-ups", "Founder-rate pricing for early users."

Onboarding:
- Step 1: business profile and service type.
- Step 2: default follow-up timing and preferred channels.
- Step 3: seed templates.
- Step 4: create first customer/job/follow-up.
- Post-onboarding dashboard: checklist with at least one item already completed.

Dashboard:
- Primary views: follow-up board, customers table, jobs table, templates, billing/settings.
- Record pattern: list/table row opens a side panel with customer, job, last contact, draft message, and next action.
- Empty state: prompt creation of the first completed job or first follow-up, with seeded example copy.
- Metrics: Due today, overdue, replied, closed this week; keep revenue/CLV claims out unless backed by real data.

## Decision

Use the references above as inspiration, not as assets to copy. The implementation direction should stay Tailwind-based, operator-focused, and product-screenshot-led. Dribbble is useful for visual breadth; SaaSFrame, SaaS Interface, Page Flows, Figma templates, and Tailwind dashboard kits are better for reusable structure.
