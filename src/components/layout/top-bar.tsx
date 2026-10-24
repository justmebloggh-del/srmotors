import Link from "next/link";
import { Mail, MessageCircle, Send } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export function TopBar() {
  return (
    <div className="hidden bg-brand-black text-brand-grey text-xs md:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-5">
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="flex items-center gap-1.5 transition-colors hover:text-brand-gold"
          >
            <Mail className="size-3.5" />
            {siteConfig.contact.email}
          </a>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-brand-gold"
          >
            <MessageCircle className="size-3.5" />
            {siteConfig.contact.whatsappDisplay}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={siteConfig.contact.telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-brand-gold"
          >
            <Send className="size-3.5" />
            Telegram
          </a>
          <Link href="/contact" className="transition-colors hover:text-brand-gold">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
