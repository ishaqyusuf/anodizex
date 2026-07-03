"use client";

import { Icons } from "@anodizex/ui/icons";
import { Input } from "@anodizex/ui/input";
import { useQueryState } from "nuqs";
import { useHotkeys } from "react-hotkeys-hook";
import { useTrack } from "@anodizex/events/client";
import { LogEvents } from "@anodizex/events";

type Props = {
  placeholder: string;
};

export function SearchField({ placeholder }: Props) {
  const [search, setSearch] = useQueryState("q");
  const track = useTrack();

  useHotkeys("esc", () => setSearch(null), {
    enableOnFormTags: true,
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;

    if (value) {
      setSearch(value);
    } else {
      setSearch(null);
    }
  };

  return (
    <div className="w-full md:max-w-[380px] relative">
      <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
      <Input
        placeholder={placeholder}
        className="pl-9 w-full"
        value={search ?? ""}
        onChange={handleSearch}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        onFocus={() => {
          track({ event: LogEvents.SearchOpened.name, channel: LogEvents.SearchOpened.channel });
        }}
      />
    </div>
  );
}
