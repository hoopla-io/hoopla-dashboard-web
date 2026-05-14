import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Store,
  Coffee,
  ShoppingCart,
  Users,
  Plus,
  BookOpen,
  LayoutPanelTop,
  LayoutGrid,
  Bell,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/partners?action=create"))}>
            <Plus className="size-4 text-muted-foreground" />
            Add partner
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/shops?action=create"))}>
            <Plus className="size-4 text-muted-foreground" />
            Add shop
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/drinks?action=create"))}>
            <Plus className="size-4 text-muted-foreground" />
            Add drink
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
            <LayoutDashboard className="size-4 text-muted-foreground" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/partners"))}>
            <Building2 className="size-4 text-muted-foreground" />
            Partners
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/shops"))}>
            <Store className="size-4 text-muted-foreground" />
            Shops
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/drinks"))}>
            <Coffee className="size-4 text-muted-foreground" />
            Drinks
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/orders"))}>
            <ShoppingCart className="size-4 text-muted-foreground" />
            Orders
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/users"))}>
            <Users className="size-4 text-muted-foreground" />
            Users
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/stories"))}>
            <BookOpen className="size-4 text-muted-foreground" />
            Stories
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/banners"))}>
            <LayoutPanelTop className="size-4 text-muted-foreground" />
            Banners
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/shop-categories"))}>
            <LayoutGrid className="size-4 text-muted-foreground" />
            Shop categories
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/notifications"))}>
            <Bell className="size-4 text-muted-foreground" />
            Notifications
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
