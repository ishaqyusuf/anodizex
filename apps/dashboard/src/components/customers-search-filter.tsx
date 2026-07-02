"use client";

import { cn } from "@afterservice/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@afterservice/ui/dropdown-menu";
import { Icons } from "@afterservice/ui/icons";
import { Input } from "@afterservice/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useTRPC } from "@/trpc/client";
import { FilterList, FilterMenuEmptyState } from "./filter-list";

export function CustomersSearchFilter() {
  const trpc = useTRPC();
  const { filter, setFilter } = useCustomerFilterParams();
  const [input, setInput] = useState(filter.q ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data } = useQuery(
    trpc.customers.list.queryOptions({
      includeArchived: false,
      limit: 100,
    }),
  );
  const tagOptions = useMemo(() => {
    const tags = new Set<string>();

    for (const customer of data?.items ?? []) {
      for (const tag of customer.tags ?? []) {
        tags.add(tag);
      }
    }

    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [data]);

  useHotkeys(
    "esc",
    () => {
      setInput("");
      setFilter(null);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(input),
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setInput(value);
    } else {
      setFilter({ q: null });
      setInput("");
    }
  };

  const handleSubmit = (evt?: React.FormEvent) => {
    evt?.preventDefault();
    setFilter({ q: input.length > 0 ? input : null });
  };

  const validFilters = Object.fromEntries(
    Object.entries(filter).filter(([key]) => key !== "q"),
  );

  const selectedTags = Array.isArray(filter.tags) ? filter.tags : [];
  const hasValidFilters = selectedTags.some((tag) => tagOptions.includes(tag));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex w-full flex-col items-start space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <form
          className="relative w-full sm:w-auto"
          onSubmit={(evt) => {
            evt.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="pointer-events-none absolute left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search customers..."
            className="w-full pl-9 pr-8 sm:w-[350px]"
            value={input}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className={cn(
                "absolute right-3 top-[10px] z-10 opacity-50 transition-opacity duration-300 hover:opacity-100",
                hasValidFilters && "opacity-100",
                isOpen && "opacity-100",
              )}
            >
              <Icons.Filter />
            </button>
          </DropdownMenuTrigger>
        </form>

        <FilterList filters={validFilters} onRemove={setFilter} />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Tags</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="max-h-[300px] overflow-y-auto p-0"
              >
                {tagOptions.length > 0 ? (
                  tagOptions.map((tag) => {
                    const selectedTags = Array.isArray(filter.tags)
                      ? filter.tags
                      : [];
                    const isChecked = selectedTags.includes(tag);

                    return (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={isChecked}
                        onSelect={(evt) => evt.preventDefault()}
                        onCheckedChange={() => {
                          const next = isChecked
                            ? selectedTags.filter((item) => item !== tag)
                            : [...selectedTags, tag];

                          setFilter({
                            tags: next.length > 0 ? next : null,
                          });
                        }}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    );
                  })
                ) : (
                  <FilterMenuEmptyState>No tags yet</FilterMenuEmptyState>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
