"use client";

import { EditCustomerSheet } from "./edit-customer-sheet";
import { ScheduleFollowUpSheet } from "./schedule-follow-up-sheet";
import { FollowUpCardSheet } from "./follow-up-card-sheet";
import { TemplateSheet } from "./template-sheet";
import { CustomerCreateSheet } from "./customer-create-sheet";
import { JobCreateSheet } from "./job-create-sheet";
import { TemplateCreateSheet } from "./template-create-sheet";
import { FollowUpCreateSheet } from "./follow-up-create-sheet";

export function GlobalSheets() {
  return (
    <>
      <EditCustomerSheet />
      <ScheduleFollowUpSheet />
      <FollowUpCardSheet />
      <TemplateSheet />
      <CustomerCreateSheet />
      <JobCreateSheet />
      <TemplateCreateSheet />
      <FollowUpCreateSheet />
    </>
  );
}
