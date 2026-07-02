import { JobsColumnVisibility } from "./jobs-column-visibility";
import { JobsSearchFilter } from "./jobs-search-filter";
import { OpenJobSheet } from "./open-job-sheet";

export async function JobsHeader() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <JobsSearchFilter />

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <JobsColumnVisibility />
        <div className="hidden sm:block">
          <OpenJobSheet />
        </div>
      </div>
    </div>
  );
}
