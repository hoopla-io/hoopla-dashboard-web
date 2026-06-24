import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Store,
  Coffee,
  ShoppingCart,
  Settings,
  ChevronDown,
  Bell,
  LayoutPanelTop,
  LayoutGrid,
  BookOpen,
  Wallet,
  TicketPercent,
  Gift,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/wordmark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";

type NavLeaf = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: NavLeaf[];
};

type NavSection = {
  label: string;
  items: (NavLeaf | NavGroup)[];
};

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { name: "Partners", href: "/partners", icon: Building2 },
      { name: "Shops", href: "/shops", icon: Store },
      { name: "Drinks", href: "/drinks", icon: Coffee },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
      { name: "Promocodes", href: "/promocodes", icon: TicketPercent },
      { name: "Gift Cards", href: "/gift-cards", icon: Gift },
      { name: "Settlements", href: "/settlements", icon: Wallet },
      { name: "Users", href: "/users", icon: Users },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Stories", href: "/stories", icon: BookOpen },
      { name: "Banners", href: "/banners", icon: LayoutPanelTop },
      { name: "Shop Categories", href: "/shop-categories", icon: LayoutGrid },
      { name: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

function isGroup(item: NavLeaf | NavGroup): item is NavGroup {
  return "children" in item;
}

function NavItem({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href;

  return (
    <Link
      to={item.href}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

function NavGroupBlock({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const hasActive = group.children.some((c) => c.href === pathname);
  const [open, setOpen] = useState(hasActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <span className="truncate">{group.name}</span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {open ? (
        <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
          {group.children.map((leaf) => (
            <NavItem key={leaf.href} item={leaf} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarContent() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center px-5">
        <Wordmark className="text-xl text-sidebar-foreground" />
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4 pt-2">
        {sections.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {section.label}
            </p>
            {section.items.map((item) =>
              isGroup(item) ? (
                <NavGroupBlock key={item.name} group={item} pathname={pathname} />
              ) : (
                <NavItem key={item.href} item={item} pathname={pathname} />
              )
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-[11px] font-medium text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {user?.name || "Admin"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.login || "—"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || "Admin"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.login}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <SidebarContent />
    </aside>
  );
}
