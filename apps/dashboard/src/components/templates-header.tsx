import { TemplatesColumnVisibility } from "./templates-column-visibility";
import { OpenTemplateSheet } from "./open-template-sheet";
import { TemplatesSearchFilter } from "./templates-search-filter";

export async function TemplatesHeader() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <TemplatesSearchFilter />

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <TemplatesColumnVisibility />
        <div className="hidden sm:block">
          <OpenTemplateSheet />
        </div>
      </div>
    </div>
  );
}
