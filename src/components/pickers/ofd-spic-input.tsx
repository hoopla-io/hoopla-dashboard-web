import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";

import { drinksApi } from "@/lib/api/domains/drinks";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

export function OfdSpicInput({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: spics = [] } = useQuery({
    queryKey: ["ofd-spics"],
    queryFn: drinksApi.getOfdSpics,
    staleTime: Infinity,
  });

  const query = value.trim().toLowerCase();
  const matches = spics.filter((s) => s.code.includes(query) || s.name.toLowerCase().includes(query));
  const known = spics.find((s) => s.code === value);
  const showList = open && matches.length > 0;

  return (
    <CommandPrimitive shouldFilter={false}>
      <Popover open={showList} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <CommandPrimitive.Input
            asChild
            value={value}
            onValueChange={(v) => {
              onValueChange(/^[\d\s]+$/.test(v) ? v.replace(/\s/g, "") : v);
              setOpen(true);
            }}
          >
            <Input
              placeholder="17-digit code, or search the list by name"
              pattern="\d{17}"
              title="SPIC code must be 17 digits"
              aria-invalid={!showList && value !== "" && !/^\d{17}$/.test(value)}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
            />
          </CommandPrimitive.Input>
        </PopoverAnchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if ((e.target as Element).closest("[cmdk-input]")) e.preventDefault();
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <CommandList>
            <CommandGroup>
              {matches.map((s) => (
                <CommandItem
                  key={s.code}
                  value={s.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => {
                    onValueChange(s.code);
                    setOpen(false);
                  }}
                >
                  {s.code} — {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
      {known && <p className="mt-1.5 text-xs text-muted-foreground">{known.name}</p>}
    </CommandPrimitive>
  );
}
