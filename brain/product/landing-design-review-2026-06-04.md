# Landing Page Design Review

Date: 2026-06-04

## Context
Reviewed the current afterservice homepage at `http://127.0.0.1:4100` in the Codex in-app Browser. The page renders `LaunchedPage` from `apps/website/src/components/launched.tsx`.

## Overall Assessment
The page has a solid SaaS visual foundation: clear typography, calm spacing, usable cards, and a believable operator-dashboard direction. The main issue is strategic and structural rather than craft alone: the page currently feels like a polished, proven, fully launched automation product, while Brain marketing/product docs still describe a feedback-first, prelaunch/free-beta posture.

## Highest Priority Fixes
- Remove duplicate global/landing navigation. The root layout header and `LandingHeader` both render, creating two stacked nav bars in the first viewport.
- Align CTA copy with the current pricing plan. Replace "14-day free trial" and "Start Free Trial" with "Free early access" / "Join the beta" / "Start free, no card required."
- Replace unsupported proof metrics with honest early-stage proof. Current claims like `$48M+ Service Revenue Tracked`, `14,200+ 5-Star Reviews Driven`, and `99.2% Conflict Resolution Rate` read as fabricated unless externally sourced.
- Reframe the hero from "Customer Lifetime Value" to the product promise in Brain: one board for after-service work so no customer check-in is missed.
- Reduce visual overstatement. The page uses oversized launch language, gradient hero text, large claims, and broad automation promises that outpace the current V1 product.

## Add
- A clear "what happens after a job" story: job completed, follow-up due, customer response, review/request/escalation, next service reminder.
- A real product screenshot or tighter dashboard mock that shows the actual follow-up board, customer list, jobs, and templates.
- A plain beta trust strip: "Built for local operators", "No credit card required", "Founder-rate pricing for early users", "Email-first follow-ups now; SMS later if true."
- Segment examples that match Brain marketing strategy: repair shops, salons/spas, clinics/wellness, contractors, installers, field service teams.
- One section for operator pain before features: scattered reminders across memory, notebooks, calendars, spreadsheets, WhatsApp, and staff habits.
- A short founder-led feedback CTA near the bottom: "Tell us how you follow up today" or "Help shape afterservice."

## Remove Or Rewrite
- Remove the duplicated root layout footer or landing footer on the homepage; one footer is enough.
- Remove "v1.0 is officially live for operators" unless launch status is updated in Brain.
- Remove "Enterprise Grade Security" from the core feature grid for now; it feels generic and not central to the landing promise.
- Rewrite "Private Conflict Resolution" and "private dispute resolver" to softer, operator-friendly language like "Private issue follow-up."
- Avoid "automatically" everywhere. Brain product principles say manual workflows first, automation second.
- Avoid public claims about Yelp/Facebook/Zapier/API/CRM integrations unless those are actually implemented or clearly marked as planned.

## Design Direction
- Keep the restrained black/white/teal palette, but reduce the gradient headline treatment. A single strong teal accent is enough.
- Lower hero headline size slightly and improve first-viewport density so the dashboard preview is visible without feeling cramped.
- Use fewer cards and more workflow-oriented sections. The most persuasive visual should be the follow-up board, not feature cards.
- Keep cards at modest radius and avoid nesting framed surfaces too deeply.
- Make the page feel like an operator tool: practical, fast, specific, and trustworthy.

## Recommended First Implementation Pass
1. Make the homepage opt out of the root layout header/footer, or remove `LandingHeader`/`LandingFooter` from `LaunchedPage`.
2. Update hero, CTA, pricing, and FAQ copy to match `brain/product/landing-pricing-alignment-plan.md`.
3. Replace metrics with early-stage trust/proof or remove the metrics band entirely.
4. Replace the feature grid with a pain-to-workflow section plus four product pillars: customers, jobs, follow-ups, templates.
5. Browser-test desktop and mobile first view, pricing section, signup CTA, and footer.

## Implementation Update

2026-06-04: Implemented the duplicate-shell fix for the website by making the root layout suppress its generic header/footer on landing-shell routes (`/` and `/pricing`). Updated the shared brand mark to use the actual afterservice icon geometry from the app icon and tuned the landing header, hero mock, and bottom CTA for a more intentional dark-mode version.

2026-06-04: Added a mobile-only sticky beta CTA decision based on the BeyondAfrica mobile reference: after the visitor scrolls beyond the hero, show a compact bottom sheet with free-beta context and a `/signup` CTA while preserving desktop layout and keeping footer content clear of the fixed sheet.

2026-06-04: Added a real mobile PWA install top-sheet decision: afterservice should expose a manifest, app icons, and service worker so supported mobile browsers can show an `Install now` prompt; while that install sheet is visible, it takes priority over the bottom beta CTA to keep the mobile viewport focused.

2026-06-05: Added UI inspiration research for landing page, onboarding, dashboard, and Tailwind-buildable templates in `brain/research/2026-06-05-ui-template-inspiration.md`. Use those references as structural inspiration while keeping the landing experience beta-positioned, operator-focused, and centered on the follow-up board workflow.
