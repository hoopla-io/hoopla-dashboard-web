"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Building2,
  Store,
  Coffee,
  ShoppingCart,
  Users,
  Plus,
  BookOpen,
} from "lucide-react";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/partners?action=create"))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/shops?action=create"))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shop
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/drinks?action=create"))}>
            <Plus className="mr-2 h-4 w-4" />
            Add Drink
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/partners"))}>
            <Building2 className="mr-2 h-4 w-4" />
            Partners
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/shops"))}>
            <Store className="mr-2 h-4 w-4" />
            Shops
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/drinks"))}>
            <Coffee className="mr-2 h-4 w-4" />
            Drinks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/orders"))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/users"))}>
            <Users className="mr-2 h-4 w-4" />
            Users
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/stories"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            Stories
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
