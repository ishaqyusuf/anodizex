"use client";

import { cn } from "@anodizex/ui/cn";
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
} from "@anodizex/ui/dropdown-menu";
import { Icons } from "@anodizex/ui/icons";
import { Input } from "@anodizex/ui/input";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  templateChannelLabels,
  templateChannels,
  toTemplateChannel,
  useTemplateFilterParams,
} from "@/hooks/use-template-filter-params";
import { FilterList } from "./filter-list";

export function TemplatesSearchFilter() {
  const { filter, setFilter } = useTemplateFilterParams();
  const [input, setInput] = useState(filter.q ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const channelFilters = templateChannels.map((channel) => ({
    id: channel,
    name: templateChannelLabels[channel],
  }));

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

  const hasValidFilters = Boolean(toTemplateChannel(filter.channel));

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
            placeholder="Search templates..."
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

        <FilterList
          filters={validFilters}
          onRemove={setFilter}
          channelFilters={channelFilters}
        />
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
              <Icons.OutgoingMail className="mr-2 h-4 w-4" />
              <span>Channel</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {channelFilters.map((channel) => (
                  <DropdownMenuCheckboxItem
                    key={channel.id}
                    checked={filter.channel === channel.id}
                    onSelect={(evt) => evt.preventDefault()}
                    onCheckedChange={(checked) => {
                      setFilter({
                        channel: checked ? channel.id : null,
                      });
                    }}
                  >
                    {channel.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
