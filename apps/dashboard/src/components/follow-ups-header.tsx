import { FollowUpsColumnVisibility } from "./follow-ups-column-visibility";
import { OpenFollowUpSheet } from "./open-follow-up-sheet";
import { FollowUpSearchFilter } from "./follow-up-search-filter";

export async function FollowUpsHeader() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <FollowUpSearchFilter />

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <FollowUpsColumnVisibility />
        <div className="hidden sm:block">
          <OpenFollowUpSheet />
        </div>
      </div>
    </div>
  );
}
