import type { SeoFaqItem } from "../components/seo-faq";

export type SolutionPage = {
  audience: string;
  cadence: Array<{
    action: string;
    timing: string;
  }>;
  description: string;
  faqs: SeoFaqItem[];
  hero: string;
  outcomes: string[];
  pain: string;
  path: string;
  slug: string;
  title: string;
  workflows: string[];
};

export type GuidePage = {
  description: string;
  faqs: SeoFaqItem[];
  intro: string;
  path: string;
  sections: Array<{
    body: string[];
    checklist?: string[];
    example?: string;
    title: string;
  }>;
  slug: string;
  title: string;
};

export type FeaturePage = {
  description: string;
  faqs: SeoFaqItem[];
  highlights: string[];
  path: string;
  practicalNotes: Array<{
    body: string;
    title: string;
  }>;
  slug: string;
  title: string;
  workflow: string[];
};

export const solutionPages: SolutionPage[] = [
  {
    audience: "Repair shops",
    cadence: [
      {
        action:
          "Confirm the repair is working as expected and capture any unresolved symptom before it becomes a surprise.",
        timing: "1-3 days after collection",
      },
      {
        action:
          "Ask for honest feedback once the customer has had enough time to use the repaired item.",
        timing: "After the first check-in",
      },
      {
        action:
          "Create a service reminder only when the repair type has a meaningful maintenance or inspection interval.",
        timing: "At the relevant service interval",
      },
    ],
    description:
      "Post-repair follow-up software for repair shops that need customer check-ins, issue recovery, review requests, and repeat-service reminders in one board.",
    faqs: [
      {
        question: "When should a repair shop follow up with a customer?",
        answer:
          "A practical first check-in is usually one to three days after collection, with timing adjusted for the repair type. The customer needs enough time to use the repaired item, but the issue should still be recent if something is wrong.",
      },
      {
        question: "Does afterservice send repair follow-ups automatically?",
        answer:
          "The free beta is manual-first. Teams plan due follow-ups, use saved drafts, and record outreach. Provider-powered automation is only planned after the workflow and customer consent requirements are proven.",
      },
    ],
    hero: "Keep every repair customer visible after the job leaves the shop.",
    outcomes: [
      "Catch unresolved issues before they become bad reviews.",
      "Ask for honest feedback after the customer has had time to use the repair.",
      "Keep repeat-service opportunities from disappearing into memory.",
    ],
    pain: "Completed repairs often move from the counter to memory, sticky notes, WhatsApp threads, or a spreadsheet. That makes it easy to miss the exact moment when a customer needs a check-in.",
    path: "/solutions/repair-shops",
    slug: "repair-shops",
    title: "Post-repair follow-up software for repair shops | afterservice",
    workflows: [
      "Log the completed repair and customer contact details.",
      "Create a due follow-up for a check-in, review request, or issue-resolution call.",
      "Use saved templates so staff know what to say without sounding robotic.",
      "Move follow-ups through a simple board until the customer outcome is resolved.",
    ],
  },
  {
    audience: "Installers",
    cadence: [
      {
        action:
          "Confirm the installation is operating normally and ask whether the customer has setup or usage questions.",
        timing: "2-7 days after installation",
      },
      {
        action:
          "Resolve any snag-list item, document the outcome, and only then make a separate honest review request.",
        timing: "After issue resolution",
      },
      {
        action:
          "Schedule maintenance, warranty, or referral follow-up when it matches the installed product and agreement.",
        timing: "At the relevant milestone",
      },
    ],
    description:
      "Customer follow-up software for installers who need structured post-install check-ins, review-safe requests, issue recovery, and referral prompts.",
    faqs: [
      {
        question: "What should a post-installation follow-up include?",
        answer:
          "Reference the installation, confirm that it is working as expected, ask about questions or unresolved items, and give the customer a clear way to reply. Keep review requests separate from issue resolution.",
      },
      {
        question: "Can an installation team share follow-up ownership?",
        answer:
          "Yes. afterservice keeps the customer, installation, due action, status, and notes together so an owner, office administrator, or field team member can understand the next step.",
      },
    ],
    hero: "Turn completed installs into reliable customer check-ins and review-safe requests.",
    outcomes: [
      "Follow up after the customer has lived with the installation.",
      "Separate issue recovery from review requests.",
      "Create a simple rhythm for referrals, maintenance, and repeat work.",
    ],
    pain: "Installers often finish great work on-site, then lose the follow-up to staff memory or an overloaded calendar. afterservice keeps the post-install workflow visible.",
    path: "/solutions/installers",
    slug: "installers",
    title: "Post-install customer follow-up software | afterservice",
    workflows: [
      "Record the completed installation and service category.",
      "Schedule a check-in based on the follow-up timing your team already uses.",
      "Track whether the customer replied, needs help, or is ready for a review request.",
      "Keep every post-install action tied to the original customer and job.",
    ],
  },
  {
    audience: "Contractors",
    cadence: [
      {
        action:
          "Check that the completed work matches expectations and surface punch-list or handover questions.",
        timing: "1-3 days after completion",
      },
      {
        action:
          "Record the resolution of any open item before asking for an honest review or referral.",
        timing: "When open items are closed",
      },
      {
        action:
          "Set a reminder for seasonal maintenance or related work only when it is useful to the customer.",
        timing: "At the next relevant season",
      },
    ],
    description:
      "Post-job follow-up software for small contractors that need customer check-ins, review requests, issue recovery, and repeat-service reminders.",
    faqs: [
      {
        question: "How can a small contractor track customer follow-ups?",
        answer:
          "Start with one owner, one due date, and one intended outcome for every completed job. A shared board is easier to maintain than reminders split across phones, notebooks, calendars, and individual staff memory.",
      },
      {
        question: "Is afterservice a full field service management system?",
        answer:
          "No. It focuses on the narrower workflow after a job is complete: customer check-ins, issue recovery, review requests, referrals, and repeat-service reminders.",
      },
    ],
    hero: "Give every completed contractor job a clear next follow-up.",
    outcomes: [
      "Stop depending on notebooks and memory after work is complete.",
      "Give office staff and owners one board for due customer check-ins.",
      "Build a repeatable habit before adding automation.",
    ],
    pain: "Small contractors win trust in the field, but post-job follow-up is usually scattered across texts, notes, calendars, and whoever remembers. afterservice gives the team a shared place to manage it.",
    path: "/solutions/contractors",
    slug: "contractors",
    title: "Post-job follow-up software for contractors | afterservice",
    workflows: [
      "Add customers and completed jobs as work wraps up.",
      "Create follow-ups for issue recovery, review requests, referrals, or repeat service.",
      "Use templates to keep communication consistent across staff.",
      "Review open and overdue follow-ups before they go cold.",
    ],
  },
  {
    audience: "Field service teams",
    cadence: [
      {
        action:
          "Confirm the visit outcome and make ownership explicit if the customer needs another action.",
        timing: "The next business day",
      },
      {
        action:
          "Move replies into an issue-recovery or resolved state so the office and field team share the same context.",
        timing: "As replies arrive",
      },
      {
        action:
          "Review overdue follow-ups and recurring service opportunities as a team.",
        timing: "Weekly",
      },
    ],
    description:
      "After-service follow-up software for small field service teams that need one board for completed jobs, customer check-ins, and manual outreach.",
    faqs: [
      {
        question: "Who should own follow-up after a field service visit?",
        answer:
          "Ownership can sit with an office administrator, service manager, owner, or technician. What matters is that each follow-up has one visible owner and a due date instead of relying on an informal handoff.",
      },
      {
        question: "Can afterservice replace a field service platform?",
        answer:
          "afterservice is designed to complement the job systems a small team already uses. Its focus is the post-visit customer workflow, not dispatch, routing, estimating, or inventory.",
      },
    ],
    hero: "One follow-up board for small field teams after the service visit is done.",
    outcomes: [
      "Make post-visit ownership clear for owners, office staff, and technicians.",
      "Track follow-ups by status instead of chasing scattered reminders.",
      "Learn the manual workflow before deciding what should be automated.",
    ],
    pain: "For small field teams, the handoff after a completed visit is where customer trust can leak. afterservice keeps each check-in tied to the customer, job, and next action.",
    path: "/solutions/field-service-teams",
    slug: "field-service-teams",
    title: "After-service follow-up software for field teams | afterservice",
    workflows: [
      "Capture the completed service visit and follow-up owner.",
      "Schedule customer check-ins around your team's real service rhythm.",
      "Use the board to see what is open, scheduled, sent, replied, or closed.",
      "Keep message logs and notes available for future customer context.",
    ],
  },
];

export const guidePages: GuidePage[] = [
  {
    description:
      "A practical post-job follow-up checklist for service businesses that want customer check-ins, issue recovery, review requests, and repeat work to happen consistently.",
    faqs: [
      {
        question: "How soon should a service business follow up after a job?",
        answer:
          "The right timing depends on when the customer can judge the work. A next-day check-in can suit a repair or short service visit, while an installation may need several days of normal use. Set timing by service category instead of using one delay for every job.",
      },
      {
        question: "What should a post-job follow-up message say?",
        answer:
          "Reference the completed work, ask one clear question, identify a real person or business, and make replying easy. Do not combine an issue check, review request, referral ask, and sales offer in the same message.",
      },
      {
        question: "Should post-job follow-up be automated?",
        answer:
          "Prove the workflow manually first. Once the team knows the right timing, message, owner, exceptions, and consent rules, automation can remove repetition without hiding customer problems.",
      },
    ],
    intro:
      "The best post-job follow-up system is simple enough for a busy operator to use every week. Start manual, make ownership clear, and only automate after the workflow is proven.",
    path: "/guides/post-job-follow-up",
    sections: [
      {
        title: "1. Start from the completed job",
        body: [
          "Every follow-up should point back to a real customer and a real completed job. Record the service, completion date, customer contact details, responsible staff member, and any handover notes while the work is still fresh.",
          "This context keeps the message specific. It also prevents a customer from receiving a generic check-in that ignores an unresolved item already known to the team.",
        ],
        checklist: [
          "Customer and preferred contact channel",
          "Completed service and completion date",
          "Follow-up owner and due date",
          "Known issue, promise, warranty, or next milestone",
        ],
      },
      {
        title: "2. Pick one next action",
        body: [
          "Choose one intended outcome: confirm the work is going well, recover an issue, request honest feedback, ask for a referral, or remind the customer about relevant repeat service. A single purpose makes the message easier to answer and the result easier to track.",
          "If the customer reports a problem, pause the promotional sequence. Create an issue-recovery action with an owner and a clear next step before considering a review or referral request.",
        ],
        example:
          "Hi Ada, this is Sam from Northside Repairs. How is the laptop working after the charging-port repair on Tuesday? Reply here if anything does not feel right.",
      },
      {
        title: "3. Match timing to the service",
        body: [
          "Follow up when the customer has enough experience to give a useful answer. A same-day message may be appropriate for confirming arrival or setup, but it is often too early to judge repair quality or a new installation.",
          "Create a small timing rule for each common service category. Review the rule when customers consistently say they have not used the product yet or when issues are being discovered before your first check-in.",
        ],
        checklist: [
          "Repairs: usually after the customer has used the repaired item",
          "Installations: after normal operation or handover",
          "Home services: after the result can be inspected",
          "Recurring work: before the next useful service interval",
        ],
      },
      {
        title: "4. Record the outcome, not only the send",
        body: [
          "A sent message is activity, not an outcome. Record whether the customer replied, needs help, declined, completed a review, accepted a referral conversation, or requires another follow-up.",
          "Outcome history gives the next staff member context and shows which service categories create recurring questions. It also stops customers from receiving duplicate requests after they have already responded.",
        ],
      },
      {
        title: "5. Review open follow-ups every week",
        body: [
          "Use one weekly review to clear overdue actions, reassign work, and close loops that no longer need attention. The board should show what is due, waiting for a reply, blocked by an issue, and complete.",
          "Keep the review short by requiring every open item to have an owner and next date. If the team repeatedly postpones a follow-up type, change or remove the workflow instead of building a larger backlog.",
        ],
      },
    ],
    slug: "post-job-follow-up",
    title: "Post-job follow-up checklist for service businesses | afterservice",
  },
  {
    description:
      "A review-safe workflow for service businesses that want to ask every customer for honest feedback without ignoring unresolved issues.",
    faqs: [
      {
        question: "What is review gating?",
        answer:
          "Review gating is the practice of selectively asking satisfied customers for public reviews while diverting dissatisfied customers elsewhere. A safer workflow invites honest feedback consistently and handles issue recovery as a separate customer-care process.",
      },
      {
        question: "When should a business ask for a review?",
        answer:
          "Ask after the customer has had enough time to judge the completed service and after known issues have been addressed. The best timing varies by repair, installation, visit, and service category.",
      },
      {
        question: "Should a review request include an incentive?",
        answer:
          "Avoid incentives that could influence sentiment or conflict with a review platform's rules. A direct, neutral request for honest feedback is simpler and more trustworthy.",
      },
    ],
    intro:
      "Good review workflows separate customer care from reputation work. First check whether the customer needs help, then ask for honest feedback when the timing is right.",
    path: "/guides/review-request-workflow",
    sections: [
      {
        title: "1. Check for unresolved issues first",
        body: [
          "Begin with a service check-in that gives the customer an easy way to raise a concern. Use the completed job as context and ask whether the result is working as expected.",
          "If the customer reports a problem, move the follow-up into issue recovery. Assign an owner, agree on the next action, and document the resolution before making any separate review request.",
        ],
        example:
          "Hi Daniel, this is Amina from Clearview Installations. Is the new unit working as expected since Friday's installation? Reply here if you have any questions or if something needs attention.",
      },
      {
        title: "2. Ask every customer honestly",
        body: [
          "Use a consistent rule for eligible completed jobs rather than choosing customers based on predicted sentiment. The request should ask for honest feedback without suggesting a rating or implying that only positive experiences belong online.",
          "Consistency protects trust and makes the workflow easier for staff to follow. It also creates more useful feedback about where service delivery or communication needs work.",
        ],
        checklist: [
          "Use neutral language",
          "Do not pre-screen by satisfaction score",
          "Do not ask staff to choose only happy customers",
          "Follow the review platform's current policies",
        ],
      },
      {
        title: "3. Keep the request tied to the job",
        body: [
          "A specific request feels more credible than a generic blast. Mention the business, the completed service, and a simple reason the feedback matters. Use the customer's preferred channel and keep the message short.",
          "Send one clear link to the intended review destination. Avoid a page full of platform choices unless customers genuinely need them, because extra decisions reduce completion.",
        ],
        example:
          "Thanks for trusting Northside Repairs with your laptop repair. If you have a moment, we would value your honest feedback about the service: [review link]",
      },
      {
        title: "4. Set a restrained reminder rule",
        body: [
          "A customer may miss the first request, but repeated reminders can quickly feel intrusive. Decide in advance whether one reminder is appropriate, how long to wait, and which outcomes should stop the sequence.",
          "Stop reminders after a reply, review completion, opt-out, complaint, or issue-recovery action. Keep a manual approval step during beta until the team understands its real response patterns.",
        ],
      },
      {
        title: "5. Measure useful outcomes",
        body: [
          "Track more than review count. Record requests sent, customer replies, issues discovered, completed reviews where known, and opt-outs. The workflow is healthy when it improves both customer care and honest public feedback.",
          "Review results by service category and timing. If one category produces more concerns, improve the service handover or move the first check-in earlier instead of simply changing the review copy.",
        ],
      },
    ],
    slug: "review-request-workflow",
    title: "Review request workflow for service businesses | afterservice",
  },
  {
    description:
      "A simple issue-recovery follow-up workflow for service operators who need to catch customer problems after the job is complete.",
    faqs: [
      {
        question: "What is service issue recovery?",
        answer:
          "Issue recovery is the process of identifying a customer problem after service, assigning responsibility, agreeing on the next action, resolving it, and confirming that the customer understands the outcome.",
      },
      {
        question: "How quickly should a service issue receive a response?",
        answer:
          "Acknowledge the concern as soon as the team can respond responsibly. The acknowledgement can be immediate even when diagnosis or repair requires more time. Give the customer a specific next update instead of an unsupported promise.",
      },
      {
        question: "Should a review request be sent after an issue?",
        answer:
          "Do not make a review request while an issue is unresolved. After the loop is closed, use the same neutral eligibility rule applied to other customers rather than pressuring the customer because the issue was recovered.",
      },
    ],
    intro:
      "Issue recovery is where good operators protect trust. The goal is not to hide problems. The goal is to find them early enough to fix them.",
    path: "/guides/issue-recovery-follow-up",
    sections: [
      {
        title: "1. Make the check-in specific",
        body: [
          "Ask directly about the completed repair, installation, visit, or service. Include enough detail for the customer to recognize the job and make replying easier than starting a new support conversation.",
          "Avoid vague satisfaction language. A useful check-in asks whether the result is working as expected and tells the customer how to raise a concern.",
        ],
        example:
          "Hi Grace, how is the water pressure after Monday's pump service? Reply here if the issue has returned or anything needs another look.",
      },
      {
        title: "2. Give the team one place to work replies",
        body: [
          "A customer reply should not remain only in one person's phone or inbox. Record the concern, current status, owner, promised action, and next update date in a shared workspace.",
          "Use the customer's wording where it matters and separate observed facts from assumptions. That context helps another staff member continue the conversation without asking the customer to repeat everything.",
        ],
        checklist: [
          "What the customer reported",
          "Who owns the response",
          "What action was promised",
          "When the customer will hear back",
        ],
      },
      {
        title: "3. Acknowledge before diagnosing",
        body: [
          "Respond promptly without guessing at the cause or promising an outcome the team has not confirmed. Acknowledge the concern, restate the immediate next step, and give a realistic update time.",
          "For higher-risk issues, move the conversation to the appropriate phone or on-site channel while keeping the follow-up record updated. The board should reflect the real work, not replace it.",
        ],
      },
      {
        title: "4. Resolve and confirm",
        body: [
          "Record the action taken, who completed it, and any warranty, refund, revisit, or replacement detail. Then confirm with the customer that the agreed action happened and ask whether anything remains open.",
          "Do not mark the issue closed merely because the team sent a response. Closure means the next action is complete and the customer has been given a reasonable opportunity to confirm the outcome.",
        ],
      },
      {
        title: "5. Learn from repeated issues",
        body: [
          "Review recovered issues by service category, technician, source, and cause where appropriate. Repeated follow-up work may point to a handover gap, unclear customer instructions, service quality problem, or poorly timed first check-in.",
          "Use patterns to improve the operation, not to suppress feedback. The goal is fewer preventable problems and faster, clearer recovery when problems still happen.",
        ],
      },
    ],
    slug: "issue-recovery-follow-up",
    title:
      "Issue recovery follow-up after completed service work | afterservice",
  },
];

export const featurePages: FeaturePage[] = [
  {
    description:
      "A manual-first follow-up board for open, scheduled, sent, replied, missed, and closed customer follow-ups after service work is complete.",
    faqs: [
      {
        question: "What belongs on a post-job follow-up board?",
        answer:
          "Each item should identify the customer, completed job, follow-up type, due date, owner, channel, status, and next action. Notes and outreach history should stay attached so another team member can continue the work.",
      },
      {
        question: "Is the follow-up board automated?",
        answer:
          "The free beta is manual-first. It helps teams prove timing, ownership, message, and exception rules before provider-powered sending or automation is introduced.",
      },
    ],
    highlights: [
      "See which customer check-ins are open, due, overdue, or resolved.",
      "Keep follow-ups tied to customer records and completed service jobs.",
      "Give owners and staff one shared place to work post-job tasks.",
    ],
    path: "/features/follow-up-board",
    practicalNotes: [
      {
        title: "One owner and one next date",
        body: "Every open follow-up should have a responsible person and a due date. That keeps shared ownership from turning into no ownership.",
      },
      {
        title: "Statuses that describe customer work",
        body: "Open, scheduled, sent, replied, missed, and closed states make the next action visible without requiring staff to read every note.",
      },
      {
        title: "Manual before automated",
        body: "Teams can learn which follow-ups deserve automation while keeping issue recovery and unusual customer situations under human control.",
      },
    ],
    slug: "follow-up-board",
    title: "Follow-up board for completed service jobs | afterservice",
    workflow: [
      "Create a follow-up from a real customer and completed service job.",
      "Choose the purpose, owner, channel, and due date.",
      "Work due items and record the outreach or customer reply.",
      "Close the loop or schedule the next action with full history attached.",
    ],
  },
  {
    description:
      "Saved follow-up templates for local service teams that want consistent customer check-ins without fully automating outbound messaging.",
    faqs: [
      {
        question:
          "What follow-up templates should a service business create first?",
        answer:
          "Start with a post-job check-in, issue acknowledgement, honest review request, and relevant repeat-service reminder. Add templates only for messages the team actually sends repeatedly.",
      },
      {
        question: "Can staff edit a template before sending it?",
        answer:
          "Yes. The beta treats templates as reusable drafts so staff can add job-specific context, check accuracy, and choose the appropriate channel before manually sending.",
      },
    ],
    highlights: [
      "Create reusable message drafts for check-ins, review requests, and issue recovery.",
      "Keep staff aligned on tone without surprising customers.",
      "Start manual and learn which messages deserve automation later.",
    ],
    path: "/features/templates",
    practicalNotes: [
      {
        title: "Specific beats generic",
        body: "Useful templates leave room for the service, completion date, customer name, and a question that matches the intended outcome.",
      },
      {
        title: "Separate customer-care moments",
        body: "Check-ins, issue recovery, review requests, referrals, and reminders should be separate drafts instead of one overloaded message.",
      },
      {
        title: "Keep human review in the loop",
        body: "A staff member can confirm the context and tone before sending, especially when a customer has an open issue or special requirement.",
      },
    ],
    slug: "templates",
    title: "Follow-up templates for service businesses | afterservice",
    workflow: [
      "Create a draft for one repeatable customer outcome.",
      "Add merge fields only for information the job record reliably contains.",
      "Preview and personalize the message before outreach.",
      "Record what was sent and improve the draft from real replies.",
    ],
  },
  {
    description:
      "Customer history for service operators who need completed jobs, follow-up notes, templates, and outreach logs in one workspace.",
    faqs: [
      {
        question: "What should a service customer history include?",
        answer:
          "Keep contact details, completed jobs, open and past follow-ups, outreach notes, replies, issue resolutions, and relevant service context together. Access remains scoped to the operator workspace.",
      },
      {
        question: "Why connect follow-ups to completed jobs?",
        answer:
          "The job explains what happened, when it happened, and why the team is contacting the customer. That context makes outreach more specific and prevents duplicate or poorly timed requests.",
      },
    ],
    highlights: [
      "Keep customers, jobs, follow-ups, and notes connected.",
      "Understand what happened before the next customer conversation.",
      "Preserve manual outreach logs for future context.",
    ],
    path: "/features/customer-history",
    practicalNotes: [
      {
        title: "Context before contact",
        body: "Staff can review the completed work, previous messages, and known issues before starting the next conversation.",
      },
      {
        title: "A continuous customer record",
        body: "Jobs and follow-ups remain connected instead of becoming isolated tasks in personal calendars or messaging apps.",
      },
      {
        title: "Useful handoffs",
        body: "Owners, office staff, and service team members can see the latest outcome and next action without asking the customer to repeat the history.",
      },
    ],
    slug: "customer-history",
    title: "Customer follow-up history for service teams | afterservice",
    workflow: [
      "Create or select the customer when recording completed work.",
      "Keep each follow-up tied to the relevant service job.",
      "Record messages, replies, notes, and issue-resolution outcomes.",
      "Use the history to prepare the next useful customer action.",
    ],
  },
];

export function getSolutionPage(slug: string) {
  return solutionPages.find((page) => page.slug === slug);
}

export function getGuidePage(slug: string) {
  return guidePages.find((page) => page.slug === slug);
}

export function getFeaturePage(slug: string) {
  return featurePages.find((page) => page.slug === slug);
}
