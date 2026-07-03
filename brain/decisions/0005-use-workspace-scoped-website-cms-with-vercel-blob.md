# ADR: Use Workspace-Scoped Website CMS With Vercel Blob Media

## Status
Accepted

## Context
Anodizex needs a public website with landing content, contact information, gallery media, completed-project roadmap entries, blog posts, and a contact form. The copied AfterService architecture already has a dashboard, Hono/tRPC API, Prisma-backed database, Better Auth sessions, and workspace membership roles. The user also requested Vercel Blob as the first media storage provider while keeping room for Cloudinary or other providers later.

## Decision
Implement website content as workspace-scoped Prisma models managed through dashboard owner/admin tRPC procedures. Public website pages read through public tRPC procedures and fall back to curated Anodizex demo content when CMS data is empty. Contact submissions use a public tRPC mutation that stores an inquiry and sends admin/customer emails through the existing Resend email service. Media records store URLs and media type, while the dashboard provides a Vercel Blob client-upload route that authenticates owner/admin users before issuing upload tokens.

## Consequences
- The dashboard can manage public website content without bypassing existing auth and workspace boundaries.
- Public pages can render immediately with fallback content before a workspace has populated CMS records.
- Vercel Blob is supported without hard-coding the database to one storage provider; records store ordinary media URLs.
- Public contact email delivery depends on `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, and the CMS/admin contact email.
- Public website reads currently choose the first available website settings workspace, which is acceptable for the single-company Anodizex phase but may need a site/workspace selection strategy if the product becomes multi-tenant website hosting.

## Alternatives Considered
- Static-only website content: faster to ship, but would not satisfy dashboard editing requirements.
- Store media provider-specific IDs only: tighter integration with one provider, but worse for later Cloudinary or external URL support.
- Public website direct database reads without tRPC: simpler in the website app, but deviates from the requested tRPC-first architecture.

## Date
2026-07-02
