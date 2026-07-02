# Feature Plan: Customer Self-Onboarding Job Flow

## Status
Planned on 2026-06-09.

## Objective
Make job creation faster for operators by allowing them to enter only a customer phone number or email first, then invite the customer to complete their own profile and job context through a branded afterservice onboarding link.

## Product Principle
The operator should not need to gather every customer detail before creating a job. The system should capture the minimum contact point, create a trackable job/customer stub, and let the customer enrich the record in a guided flow.

## Recommended Flow

### 1. Operator Starts With Contact
- Add a "New job" quick flow where the first required field is `phone` or `email`.
- Search for an existing customer by normalized phone/email.
- If a match exists, attach the job to that customer.
- If no match exists, create a lightweight customer record with missing profile fields marked incomplete.
- Create a draft or intake-stage service job tied to that customer.

### 2. Operator Sends Invite
- Generate a secure customer onboarding token scoped to workspace, customer, and optional service job.
- Show an editable SMS/email preview before send.
- Keep MVP-safe behavior: log/preview manual send first, then wire real SMS/email providers later.
- Message should be short and benefit-led:
  - Track your service in one place.
  - Share details once so future work is easier.
  - Get updates, request more service, and rate completed work.

### 3. Customer Opens Branded Onboarding
- Route should live under `afterservice.app` and feel like a lightweight customer service hub, not an admin dashboard.
- No customer account should be required for the first version.
- Tokenized link opens a mobile-first page with the business name and service context.
- First screen should communicate value before asking for data:
  - "Keep track of your work"
  - "Get faster help next time"
  - "See service updates and share feedback"

### 4. Customer Completes Progressive Fields
Collect information in short steps:
- Name.
- Preferred contact method.
- Service address or location, if relevant.
- Service details or notes.
- Optional photos/files in a later phase.
- Consent for SMS/email updates where required.

Avoid asking for fields already known from the operator-entered phone/email or existing customer record.

### 5. Operator Gets Updated Job Context
- Mark customer onboarding as completed.
- Update the customer profile and service job with customer-submitted data.
- Add a follow-up event/timeline entry.
- Surface an inbox or jobs-table indicator: `Customer details complete`.
- Let the operator review customer-submitted fields before using them in outbound messages if the data affects customer-facing communication.

### 6. Post-Job Customer Loop
After the job is completed, reuse the same customer hub concept for:
- Rating the completed work.
- Reporting an issue.
- Requesting another service.
- Viewing basic follow-up status.

## Data Model Needs
- `CustomerOnboardingSession` or equivalent token/session model.
- Fields:
  - workspace ID
  - customer ID
  - optional service job ID
  - token hash
  - channel
  - status: pending, opened, submitted, expired, revoked
  - expires at
  - opened/submitted timestamps
- Add customer profile completeness fields only if needed for UI filtering; otherwise derive completeness from required fields.

## API Needs
- Operator mutation to create onboarding session for a customer/job.
- Operator mutation to mark/log invite sent.
- Public token lookup endpoint with strictly limited fields.
- Public onboarding submit endpoint.
- Timeline/event creation on open and submit.

## UI Needs
- Job create sheet: contact-first mode.
- Invite preview: SMS/email template and channel selector.
- Customer onboarding page: mobile-first, branded, short steps.
- Jobs table/detail: onboarding status badge and customer-submitted update indicator.

## Messaging Copy Direction
Use benefit-led, customer-safe language:

SMS:
`Hi {{customer_name_or_there}}, {{business_name}} uses afterservice so you can track this job, share details, and get easier follow-up. Start here: {{link}}`

Email subject:
`Finish your service setup with {{business_name}}`

Email body:
`Share a few details once so {{business_name}} can keep your work organized, send better updates, and make future service easier.`

## Safety And Compliance
- Do not auto-send real SMS/email until provider credentials, consent capture, and unsubscribe/STOP handling are implemented.
- Customer token pages must expose only the minimum required customer/job data.
- Tokens should be hashed at rest, expire, and be revocable.
- Public submit endpoints must validate workspace/customer/job relationships from the token, not from client-provided IDs.
- Customer-submitted notes should be treated as untrusted input.

## Acceptance Criteria
- Operator can create a job from only phone or email.
- Existing customer matching prevents accidental duplicates.
- New customers can be created as incomplete stubs.
- Operator can generate and preview a customer onboarding invite.
- Customer can open a tokenized page and complete missing profile fields.
- Submitted data updates the customer/job and creates timeline visibility for the operator.
- No real outbound messaging is sent until provider integration is explicitly enabled.
