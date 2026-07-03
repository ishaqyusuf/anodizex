# Backlog

## Purpose
This file tracks unstarted work outside the active phase checklist.

## Current Backlog
- Customer self-onboarding job flow.
- Generate formal Prisma migration history for the website CMS schema now that the local Docker database is available on port `55435`.
- Configure `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, and the production Anodizex contact email before production contact/media use.
- Replace inherited afterservice pricing, feature, solution, guide, privacy, and terms copy with Anodizex-specific pages in a dedicated cleanup pass.
- Add richer dashboard editing for existing roadmap, gallery, and blog records after the first-pass CMS is validated.
- Resolve the root Turbo Prisma `P1001` issue so formal migration history can be generated for the website CMS and project quotation schema.
- Add quotation PDF/export, customer email sending, tax/discount controls, revision history, and full saved-quote editing polish after the first quotation pass is validated.

## Customer Self-Onboarding Job Flow
Status: backlog
Phase: post-MVP workflow improvement
Owner: product/engineering
Context: Let operators start a job by entering only customer phone or email, then send a branded afterservice onboarding link so the customer completes profile and service details.
Acceptance:
- Operator can create a job from only phone or email.
- Existing customer matching prevents avoidable duplicates.
- New customer records can exist as incomplete stubs.
- Operator can generate and preview a customer onboarding invite.
- Customer can complete missing details through a tokenized mobile-first page.
- Submitted details update customer/job records and create operator-visible timeline activity.
- No real outbound SMS/email sends occur until provider, consent, and unsubscribe safety are explicitly implemented.

## Intake Template
```md
## <Task Name>
Status: backlog
Phase:
Owner:
Context:
Acceptance:
```
