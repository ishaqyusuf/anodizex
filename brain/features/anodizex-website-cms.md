# Anodizex Website CMS

## Feature
Name: Anodizex public website and dashboard CMS
Status: implemented first pass
Phase: Anodizex website foundation
Owner: product/engineering

## Problem
Anodizex needs a professional public website for aluminium systems, completed work, media, blog content, and project enquiries, while dashboard users need basic controls to keep public contact and media content current.

## Users
- Public customers, architects, contractors, and commercial clients browsing Anodizex.
- Admin dashboard users managing contact details, gallery media, completed-project roadmap entries, blog posts, and contact enquiries.

## Scope
- Public landing page with hero, aluminium systems, roadmap, gallery, blog, and contact sections.
- Public `/contact` page with a Zod-validated enquiry form.
- Public project detail pages at `/projects/[slug]` with information, project log, and images/videos.
- Public blog pages at `/blog/[slug]`.
- Dashboard `/website` page for editing contact information, adding/removing/reordering gallery items, adding/removing/reordering roadmap projects, adding project media, adding/removing blog posts, and viewing enquiries.
- Vercel Blob client-upload route for dashboard owner/admin media uploads when `BLOB_READ_WRITE_TOKEN` is configured.
- Telegram-only raw media import for cataloging bot-received images/videos into unassigned gallery items backed by Vercel Blob.
- External media URLs remain supported as a fallback and future storage-provider abstraction point.

## Out Of Scope
- Full rich text editing.
- Cloudinary or other media-provider implementations.
- Public domain rename from copied `afterservice` domains.
- Deleting inherited afterservice feature, solution, pricing, guide, privacy, or terms pages.
- Email template design beyond plain confirmation/admin notification bodies.

## UX
- Landing page uses Anodizex as the first-viewport signal, with a real architectural image background and clear calls to request consultation or view completed work.
- Contact form sends an admin notification and a customer confirmation email when Resend env is configured.
- Dashboard CMS uses tabs for Contact, Gallery, Roadmap, Blog, and Inquiries.
- Gallery and roadmap list ordering uses simple up/down controls.
- Gallery items can be added manually, uploaded through Vercel Blob, imported from Telegram, edited after import, tagged, dated, featured/unfeatured, and later assigned to projects.

## Data
- Prisma models: `WebsiteSettings`, `WebsiteProject`, `WebsiteProjectMedia`, `WebsiteGalleryItem`, `BlogPost`, and `ContactInquiry`.
- New enums: `WebsiteMediaType` and `ContactInquiryStatus`.
- Website CMS content is workspace-scoped for dashboard management.
- `WebsiteGalleryItem` stores tags, media dates, Telegram source IDs, Blob pathnames, and source metadata for imported raw media.
- Public reads use the first available website settings workspace and fallback Anodizex demo content when the CMS is empty.

## API
- Public tRPC procedures: `website.getLanding`, `website.getProject`, `website.getBlogPost`, and `website.submitContact`.
- Owner/admin tRPC procedures under `website.admin.*` manage settings, gallery, roadmap projects/media, blog posts, and inquiry status.
- Website `/api/contact` is a thin public adapter that validates input and delegates to `website.submitContact`.
- Dashboard `/api/website/blob/upload` authenticates owner/admin users before generating Vercel Blob client upload tokens.
- Root Telegram import scripts read bot updates, download configured chat media, upload public Blob files, and upsert workspace-scoped gallery items by Telegram `file_unique_id`.

## Acceptance Criteria
- [x] Landing page presents Anodizex aluminium systems content and uses real image assets.
- [x] Contact form validates with Zod, stores inquiry data, and attempts admin/customer emails.
- [x] Dashboard can edit public contact address/details.
- [x] Dashboard can add, remove, and reorder gallery items.
- [x] Dashboard can add and reorder roadmap projects and attach images/videos to project pages.
- [x] Roadmap project cards open public project detail pages with log and media.
- [x] Landing page includes blog cards and public blog pages.
- [x] Vercel Blob support exists through an authenticated client-upload route.
- [x] Telegram bot media can be cataloged as unassigned gallery items for later dashboard organization.

## Verification
- 2026-07-04 Telegram media import update:
  - `bun run db:validate` passed.
  - `bun --filter @anodizex/db db:generate` passed.
  - `bun --filter @anodizex/api typecheck` passed.
  - `bun --filter @anodizex/dashboard typecheck` passed.
  - `bun scripts/import-telegram-media.mjs --limit=1` loaded the importer and failed fast with `TELEGRAM_BOT_TOKEN is required.`, as expected without configured secrets.
  - Full `bun run typecheck` was attempted but was killed with exit 137 during shared package TypeScript checks.
  - Required root `bun run db:migrate` and `bun run db:push` were attempted but blocked by Turbo's interactive task guard before Prisma ran.
- `bun install` completed and saved the lockfile.
- `bun db:migrate` and `bun db:push` were attempted as required, but both failed because `DATABASE_URL` is not available in this environment.
- `DATABASE_URL=postgresql://user:pass@localhost:5432/anodizex bun --filter @anodizex/db db:generate` refreshed the ignored generated Prisma client locally.
- Local Docker Postgres was later configured on port `55435`; `bun run db:start`, package-level `db:validate`, and `bun run db:local:push` passed. The local database identity was then corrected to the Anodizex URL `postgresql://anodizex:anodizex@localhost:55435/anodizex`.
- Recommended follow-up checks after generating formal migration history: package-level typechecks for API/dashboard/website, and manual browser checks for `/`, `/contact`, `/projects/lagoon-house-sliding-systems`, `/blog/choosing-aluminium-systems`, and dashboard `/website`.
