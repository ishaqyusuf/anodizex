# System Overview

## Purpose
This file summarizes the current system baseline and intended direction.

## Current Baseline
- The repository is seeded from `/Users/M1PRO/Documents/code/micro-startups/after-service`.
- It is a private Bun/Turbo monorepo with website, dashboard, API, shared packages, scripts, and Prisma-backed database tooling.
- Existing `afterservice` route/domain strings remain copied where they have not yet had a dedicated product/domain cleanup.
- Package scopes have been renamed to `@anodizex/*`.
- Local development uses an Anodizex-named Docker Postgres database at `postgresql://anodizex:anodizex@localhost:55435/anodizex`.

## Target Direction
- Rework the copied product into Anodizex: an aluminium windows, sliding systems, doors, and façades platform.
- Use the existing app/dashboard/API structure to accelerate development rather than starting from scratch.
- Remove irrelevant after-service follow-up flows in later passes after the new product surface is defined.
- First Anodizex website/CMS pass now covers public landing, contact enquiries, gallery, roadmap project pages, blog pages, dashboard content management, and Vercel Blob media upload support.
- First dashboard quotation pass now covers material cost management, cost history, BOQ-style project quotations, markup calculation, and saved quote totals for aluminium system projects.
