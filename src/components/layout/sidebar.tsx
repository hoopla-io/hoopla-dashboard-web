"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Management",
    icon: Building2,
    children: [
      { name: "Partners", href: "/partners", icon: Building2 },
      { name: "Shops", href: "/shops", icon: Store },
      { name: "Drinks", href: "/drinks", icon: Coffee },
    ],
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Banners",
    href: "/banners",
    icon: LayoutPanelTop,
  },
  {
    name: "Shop Categories",
    href: "/shop-categories",
    icon: LayoutGrid,
  },
  {
    name: "Stories",
    href: "/stories",
    icon: BookOpen,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function SidebarContent() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["Management"]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Coffee className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Hoopla</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Main Menu
        </p>
        {navigation.map((item) =>
          item.children ? (
            <div key={item.name}>
              <button
                onClick={() => toggleGroup(item.name)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    openGroups.includes(item.name) && "rotate-180"
                  )}
                />
              </button>
              {openGroups.includes(item.name) ? (
                <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === child.href
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <child.icon className="h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-sidebar md:flex md:flex-col">
      <SidebarContent />
    </aside>
  );
}
