# SEO Roadmap

Date: 2026-06-09

## Purpose

This file is the source of truth for afterservice organic search strategy.

## Current Stage

- Stage: free beta / early access.
- Primary SEO goal: create qualified beta conversations and signups from local service operators.
- Secondary SEO goal: build topical authority around post-job follow-up workflows before broad paid launch.
- Non-goal: compete for broad CRM, field service management, or reputation-management keywords before beta usage proves the wedge.

## Implementation Status

Updated: 2026-06-18

- `https://www.afterservice.app` is the canonical marketing origin, matching the live apex-to-www production redirect.
- The sitemap contains 15 indexable marketing, solution, feature, guide, pricing, and legal URLs with route-specific modification dates.
- Login and signup entry routes are excluded from crawling and the sitemap because they redirect to dashboard authentication.
- `/customers` permanently redirects to `/features/customer-history` to avoid competing customer-history pages.
- Global metadata includes canonical URLs, Open Graph, X/Twitter cards, and optional Google Search Console verification through `GOOGLE_SITE_VERIFICATION`.
- Organization and SoftwareApplication structured data are present on the homepage.
- Article, BreadcrumbList, and FAQPage structured data are present where relevant.
- The features hub links to every feature, priority solution segment, and practical guide.
- Three feature pages, four solution pages, and three guides now include workflow-specific detail, examples, checklists, cadence guidance, and FAQs.
- Google Search Console ownership verification and sitemap submission remain operational steps. Add the Google-issued token to `GOOGLE_SITE_VERIFICATION`, deploy, verify ownership, and submit `https://www.afterservice.app/sitemap.xml`.

## Search Positioning

afterservice should own a narrow, practical category:

> Post-job follow-up software for local service operators.

Priority segments:

- Repair shops.
- Installers.
- Small home-service contractors.
- Field service teams with 1-10 staff.

Core search themes:

- Post-job follow-up.
- Customer check-ins after service.
- Review-safe review request workflows.
- Issue recovery after completed work.
- Repeat-service reminders.
- Follow-up templates for local service teams.

## 90-Day Roadmap

### Weeks 1-2: Technical Foundation

- [x] Add crawlable sitemap and robots routes for `afterservice.app`.
- [x] Add canonical URLs, Open Graph metadata, Twitter metadata, and production `metadataBase`.
  - 2026-06-12: Added a root generated Open Graph image route and wired the global metadata helper to use `summary_large_image` cards for X/Twitter and image-backed Open Graph previews.
- [x] Add structured data for Organization, SoftwareApplication, Article, FAQPage, and BreadcrumbList where relevant.
- [x] Keep login-style utility pages out of the index when they do not help searchers.
- [ ] Verify Google Search Console and submit the sitemap. Code support is complete; the Google-issued verification token and Search Console property access are required.

### Weeks 2-4: High-Intent Pages

- [x] Publish solution pages for repair shops, installers, contractors, and field service teams.
- [x] Publish deeper feature pages for follow-up board, templates, and customer history.
- [x] Link solution and guide pages from homepage/footer navigation and the features hub.
- [x] Keep every page free-beta aligned: "Join Free Beta" and "no credit card required."

### Weeks 4-8: Helpful Content Cluster

- [x] Publish practical guides grounded in real operator workflows:
  - [x] Post-job follow-up checklist.
  - [x] Review request workflow for service businesses.
  - [x] Issue recovery follow-up after completed work.
  - [ ] Spreadsheet vs follow-up board for service teams.
  - [ ] Follow-up templates for repair shops, installers, and contractors.
- Use beta feedback and operator language from `brain/marketing/feedback.md`.
- Avoid generic AI-style articles and unsupported automation claims.

### Weeks 8-12: Authority And Distribution

- Turn beta learnings into anonymized case studies when permission exists.
- Repurpose each useful guide into X/Twitter and LinkedIn posts for founder-led distribution.
- Pursue relevant backlinks from local business newsletters, trade blogs, service-business consultants, and startup/beta directories with strong audience fit.

## Measurement

Track weekly:

- Indexed pages.
- Search impressions.
- Organic clicks.
- Top queries by page.
- Organic signup CTA clicks.
- Free beta signup completions.
- Activated organic workspaces: workspace created, first customer added, and first follow-up created.

SEO is working only when search visitors become qualified beta conversations or activated workspaces.

## Content Rules

- Lead with the operator workflow, not SaaS category language.
- Prefer concrete segments over generic "small business" copy.
- Keep review request messaging review-safe: ask every customer for honest feedback and keep issue recovery separate.
- Do not imply automated outbound messaging is live unless the page clearly marks it as planned or provider-configured.
- Update this file when the target ICP, pricing posture, or launch stage changes.
