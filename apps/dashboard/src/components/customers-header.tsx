import { CustomersColumnVisibility } from "./customers-column-visibility";
import { OpenCustomerSheet } from "./open-customer-sheet";
import { CustomersSearchFilter } from "./customers-search-filter";

export async function CustomersHeader() {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <CustomersSearchFilter />

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <CustomersColumnVisibility />
        <div className="hidden sm:block">
          <OpenCustomerSheet />
        </div>
      </div>
    </div>
  );
}
