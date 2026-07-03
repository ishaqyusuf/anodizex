"use client";

import { dashboardNavItems } from "@anodizex/site-nav";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@anodizex/ui/command";
import { Icons } from "@anodizex/ui/icons";
import { Spinner } from "@anodizex/ui/spinner";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceValue } from "usehooks-ts";
import { useSearchStore } from "@/store/search";

type SearchItemType = "shortcut" | "customer" | "job" | "follow_up" | "template";

type SearchResultData = {
  name?: string;
  title?: string;
};

interface SearchItem {
  id: string;
  type: SearchItemType;
  title: string;
  data?: SearchResultData;
  action?: () => void;
}

const formatGroupName = (name: string): string | null => {
  switch (name) {
    case "shortcut":
      return "Shortcuts";
    case "customer":
      return "Customers";
    case "job":
      return "Jobs";
    case "follow_up":
      return "Follow-ups";
    case "template":
      return "Templates";
    default:
      return null;
  }
};

const SearchResultItemDisplay = ({ item }: { item: SearchItem }) => {
  let icon: ReactNode | undefined;
  let resultDisplay: ReactNode = item.title;

  if (!item.data) {
    icon = <Icons.Shortcut className="size-4 dark:text-[#666] text-primary" />;
  } else {
    switch (item.type) {
      case "customer":
        icon = <Icons.Customers className="size-4 dark:text-[#666] text-primary" />;
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.name ?? item.title}</span>
            </div>
          </div>
        );
        break;
      case "job":
        icon = <Icons.Invoice className="size-4 dark:text-[#666] text-primary" />;
        resultDisplay = (
          <div className="flex items-center w-full">
            <div className="flex-grow truncate flex gap-2 items-center">
              <span>{item.data.title ?? item.title}</span>
            </div>
          </div>
        );
        break;
      default:
        icon = <Icons.Search className="size-4 dark:text-[#666] text-primary" />;
        break;
    }
  }

  const handleSelect = () => {
    item.action?.();
  };

  return (
    <CommandItem
      key={item.id}
      value={item.id}
      onSelect={handleSelect}
      className="text-sm flex flex-col items-start gap-1 py-2 group/item"
    >
      <div className="flex items-center gap-2 w-full">
        {icon}
        {resultDisplay}
      </div>
    </CommandItem>
  );
};

export function Search() {
  const [debounceDelay] = useState(200);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setOpen } = useSearchStore();

  useHotkeys(
    "esc",
    () => {
      setDebouncedSearch("");
    },
    {
      enableOnFormTags: true,
    },
  );

  const [debouncedSearch, setDebouncedSearch] = useDebounceValue(
    "",
    debounceDelay,
  );

  const sectionActions = useMemo<SearchItem[]>(
    () =>
      dashboardNavItems.map((item) => ({
        id: `sc-view-${item.href === "/" ? "overview" : item.href.slice(1)}`,
        type: "shortcut",
        title: `Go to ${item.label}`,
        action: () => {
          setOpen();
          router.push(item.href);
        },
      })),
    [router, setOpen],
  );

  // Stubbed until the global search endpoint is built in the backend.
  const isLoading = false;
  const isFetching = false;
  const searchResults: SearchItem[] = [];

  const combinedData = useMemo(() => [...searchResults], [searchResults]);

  const groupedData = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    for (const item of combinedData) {
      const groupKey = item.type || "other";
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }

    const filteredSectionActions = debouncedSearch
      ? sectionActions.filter((action) =>
          action.title.toLowerCase().includes(debouncedSearch.toLowerCase()),
        )
      : sectionActions;

    for (const actionItem of filteredSectionActions) {
      const groupKey = actionItem.type;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(actionItem);
    }

    return groups;
  }, [combinedData, debouncedSearch, sectionActions]);

  return (
    <div className="flex flex-col h-full bg-background relative" id="search">
      <Command
        className="w-full h-full bg-transparent border-none focus-visible:outline-none"
        shouldFilter={false}
      >
        <div className="flex items-center relative border-b border-border pl-1">
          <div className="w-10 flex items-center justify-center pointer-events-none">
            {isFetching ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.Search className="size-4 text-muted-foreground" />
            )}
          </div>
          <CommandInput
            ref={searchInputRef}
            placeholder="Search or jump to a page..."
            onValueChange={(val) => {
              setDebouncedSearch(val);
            }}
            className="border-none focus-visible:outline-none focus:ring-0 px-0 focus:border-none focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 h-14 bg-transparent outline-none ring-0 focus-visible:shadow-none font-medium ml-1 w-[calc(100%-2.5rem)]"
          />
          {debouncedSearch && (
            <button
              type="button"
              onClick={() => {
                setDebouncedSearch("");
                if (searchInputRef.current) {
                  searchInputRef.current.value = "";
                  searchInputRef.current.focus();
                }
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-md"
            >
              <Icons.Close className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <CommandList className="h-[350px] overflow-y-auto w-full border-none focus-visible:outline-none scrollbar-hide py-2 pb-4">
          {!isLoading && Object.keys(groupedData).length === 0 && (
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-medium">
              No results found.
            </CommandEmpty>
          )}

          {Object.entries(groupedData).map(([groupName, items]) => (
            <CommandGroup
              key={groupName}
              heading={formatGroupName(groupName)}
              className="text-muted-foreground [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground px-2"
            >
              {items.map((item) => (
                <SearchResultItemDisplay key={item.id} item={item} />
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}
