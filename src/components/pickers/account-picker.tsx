import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { usersApi } from "@/lib/api/domains/users";

export function AccountPicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["users-search-by-phone", search],
    queryFn: () => usersApi.getAll({ phone_number: search || undefined, limit: 10 }),
    enabled: open,
  });
  const users = data?.data || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {value ? `Account #${value}` : "Anyone"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by phone…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="anyone" onSelect={() => { onChange(undefined); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value === undefined ? "opacity-100" : "opacity-0")} />
                Anyone
              </CommandItem>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={String(u.id)}
                  onSelect={() => { onChange(u.id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === u.id ? "opacity-100" : "opacity-0")} />
                  <span className="flex flex-col">
                    <span className="text-sm">{u.phone_number || `#${u.id}`}</span>
                    {u.name && <span className="text-xs text-muted-foreground">{u.name}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
