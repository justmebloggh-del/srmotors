"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Image as ImageIcon,
  Tags,
  Ship,
  Inbox,
  FileText,
  Newspaper,
  History,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/taxonomies", label: "Brands & Categories", icon: Tags },
  { href: "/admin/shipping", label: "Shipping & Customs", icon: Ship },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/content", label: "Site Content", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
];

export function AdminSidebar({ fullName, role }: { fullName: string | null; role: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-brand-black text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Image src="/brand/logo-mark.png" alt="SR Motors" width={32} height={32} className="size-8 rounded-sm object-cover" />
        <div>
          <p className="text-sm font-semibold">SR Motors</p>
          <p className="text-xs text-brand-grey">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-brand-grey transition-colors hover:bg-white/5 hover:text-white",
                active && "bg-brand-gold/10 text-brand-gold",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium">{fullName ?? "Admin"}</p>
        <p className="text-xs capitalize text-brand-grey">{role}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-3 flex items-center gap-2 text-xs text-brand-grey hover:text-brand-gold"
          >
            <LogOut className="size-3.5" /> Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
