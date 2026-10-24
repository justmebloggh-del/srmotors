import type { Metadata } from "next";
import { Mail, MessageCircle, Send } from "lucide-react";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with SR Motors via WhatsApp, Telegram or email.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Contact SR Motors</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Have a question about a vehicle, shipping, or the import process? Reach out — we respond
        fastest on WhatsApp.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-sm border border-border p-4 transition-colors hover:border-brand-gold"
          >
            <MessageCircle className="size-5 text-[#25D366]" />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-muted-foreground">{siteConfig.contact.whatsappDisplay}</p>
            </div>
          </a>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="flex items-center gap-3 rounded-sm border border-border p-4 transition-colors hover:border-brand-gold"
          >
            <Mail className="size-5 text-brand-gold" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{siteConfig.contact.email}</p>
            </div>
          </a>
          <a
            href={siteConfig.contact.telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-sm border border-border p-4 transition-colors hover:border-brand-gold"
          >
            <Send className="size-5 text-[#229ED9]" />
            <div>
              <p className="font-medium">Telegram Channel</p>
              <p className="text-sm text-muted-foreground">@srmotorsghana</p>
            </div>
          </a>
        </div>

        <div className="rounded-sm border border-border p-6">
          <EnquiryForm source="contact_page" />
        </div>
      </div>
    </div>
  );
}
