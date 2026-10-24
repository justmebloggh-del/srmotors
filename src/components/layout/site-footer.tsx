import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle, Send } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-brand-black text-brand-grey">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Image
            src="/brand/logo-lockup.png"
            alt="SR Motors — Car Sales & Imports"
            width={200}
            height={107}
            className="h-16 w-auto object-contain"
          />
          <p className="mt-4 text-sm leading-relaxed text-brand-grey/80">
            {siteConfig.tagline}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-white">
            Navigate
          </h3>
          <ul className="space-y-2.5 text-sm">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-brand-gold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="transition-colors hover:text-brand-gold">
                Blog
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-white">
            Legal
          </h3>
          <ul className="space-y-2.5 text-sm">
            {siteConfig.legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-brand-gold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/faq" className="transition-colors hover:text-brand-gold">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-white">
            Get In Touch
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 transition-colors hover:text-brand-gold"
              >
                <Mail className="size-4 shrink-0" />
                {siteConfig.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${siteConfig.contact.whatsappE164}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-brand-gold"
              >
                <MessageCircle className="size-4 shrink-0" />
                {siteConfig.contact.whatsappDisplay}
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-brand-gold"
              >
                <Send className="size-4 shrink-0" />
                Telegram Channel
              </a>
            </li>
            <li>
              <a
                href={siteConfig.contact.whatsappChannel}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-brand-gold"
              >
                <MessageCircle className="size-4 shrink-0" />
                WhatsApp Channel
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-brand-grey sm:flex-row">
          <p>© {new Date().getFullYear()} SR Motors. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <span>Ghana-focused automobile sales &amp; import specialists.</span>
            <Link href="/admin/login" rel="nofollow" className="transition-colors hover:text-brand-gold">
              Staff login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
