"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-black/10 bg-brand-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-lockup.png"
            alt="SR Motors — Car Sales & Imports"
            width={220}
            height={118}
            preload
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-sm px-3 py-2 text-sm font-medium tracking-wide text-brand-grey transition-colors hover:text-brand-gold",
                  active && "text-brand-gold",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Button
            asChild
            className="bg-brand-gold text-brand-black hover:bg-brand-gold-light"
          >
            <Link href="/vehicles">Explore Vehicles</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-brand-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-brand-black text-brand-white">
            <SheetHeader>
              <SheetTitle className="text-brand-white">Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-sm px-2 py-3 text-base font-medium text-brand-grey transition-colors hover:text-brand-gold"
                >
                  {item.label}
                </Link>
              ))}
              <Button
                asChild
                className="mt-4 bg-brand-gold text-brand-black hover:bg-brand-gold-light"
              >
                <Link href="/vehicles" onClick={() => setOpen(false)}>
                  Explore Vehicles
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
