import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
  TicketPercent,
  Gift,
  Wallet,
  Settings,
  Sparkles,
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
import { partnersApi } from "@/lib/api/domains/partners";
import { shopsApi } from "@/lib/api/domains/shops";
import { drinksApi } from "@/lib/api/domains/drinks";
import { usersApi } from "@/lib/api/domains/users";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      return;
    }
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search, open]);

  const trimmedSearch = debouncedSearch.trim();

  const { data: searchResults } = useQuery({
    queryKey: ["command-palette-search", trimmedSearch],
    queryFn: async () => {
      const [partners, shops, drinks, users] = await Promise.all([
        partnersApi.getAll({ search: trimmedSearch, limit: 5 }),
        shopsApi.getAll({ search: trimmedSearch, limit: 5 }),
        drinksApi.getAll({ search: trimmedSearch, limit: 5 }),
        usersApi.getAll({ name: trimmedSearch, limit: 5 }),
      ]);
      return {
        partners: partners.data,
        shops: shops.data,
        drinks: drinks.data,
        users: users.data,
      };
    },
    enabled: open && trimmedSearch.length > 1,
  });

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const hasResults =
    !!searchResults &&
    (searchResults.partners.length > 0 ||
      searchResults.shops.length > 0 ||
      searchResults.drinks.length > 0 ||
      searchResults.users.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {hasResults && (
          <>
            <CommandGroup heading="Results">
              {searchResults!.partners.map((partner) => (
                <CommandItem
                  key={`partner-${partner.id}`}
                  value={`partner-${partner.id}-${partner.name}`}
                  onSelect={() => runCommand(() => navigate(`/partners/${partner.id}`))}
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  {partner.name}
                  <span className="ml-auto text-xs text-muted-foreground">Partner</span>
                </CommandItem>
              ))}
              {searchResults!.shops.map((shop) => (
                <CommandItem
                  key={`shop-${shop.id}`}
                  value={`shop-${shop.id}-${shop.name}`}
                  onSelect={() => runCommand(() => navigate(`/shops/${shop.id}`))}
                >
                  <Store className="size-4 text-muted-foreground" />
                  {shop.name}
                  <span className="ml-auto text-xs text-muted-foreground">Shop</span>
                </CommandItem>
              ))}
              {searchResults!.drinks.map((drink) => (
                <CommandItem
                  key={`drink-${drink.id}`}
                  value={`drink-${drink.id}-${drink.name}`}
                  onSelect={() => runCommand(() => navigate(`/drinks?search=${encodeURIComponent(drink.name)}`))}
                >
                  <Coffee className="size-4 text-muted-foreground" />
                  {drink.name}
                  <span className="ml-auto text-xs text-muted-foreground">Drink</span>
                </CommandItem>
              ))}
              {searchResults!.users.map((user) => (
                <CommandItem
                  key={`user-${user.id}`}
                  value={`user-${user.id}-${user.name || user.phone_number || ""}`}
                  onSelect={() =>
                    runCommand(() =>
                      navigate(`/orders?search=${encodeURIComponent(user.phone_number || "")}`)
                    )
                  }
                >
                  <Users className="size-4 text-muted-foreground" />
                  {user.name || user.phone_number}
                  <span className="ml-auto text-xs text-muted-foreground">User</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => runCommand(() => navigate("/partners/onboarding"))}>
            <Sparkles className="size-4 text-muted-foreground" />
            Onboard new partner
          </CommandItem>
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
          <CommandItem onSelect={() => runCommand(() => navigate("/promocodes"))}>
            <TicketPercent className="size-4 text-muted-foreground" />
            Promocodes
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/gift-cards"))}>
            <Gift className="size-4 text-muted-foreground" />
            Gift cards
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/settlements"))}>
            <Wallet className="size-4 text-muted-foreground" />
            Settlements
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
          <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
            <Settings className="size-4 text-muted-foreground" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
