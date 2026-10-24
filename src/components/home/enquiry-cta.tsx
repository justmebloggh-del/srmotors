import { Send, MessageCircle } from "lucide-react";
import { EnquiryForm } from "@/components/shared/enquiry-form";
import { siteConfig } from "@/lib/site-config";

export function EnquiryCta() {
  return (
    <section className="bg-brand-black py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Have a Vehicle in Mind?</h2>
          <p className="mt-3 max-w-md text-brand-grey">
            Send us your details and we&apos;ll get back to you — or reach us directly on our
            official channels below.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={siteConfig.contact.whatsappChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 text-sm font-semibold text-brand-black"
            >
              <MessageCircle className="size-4" /> WhatsApp Channel
            </a>
            <a
              href={siteConfig.contact.telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-sm bg-[#229ED9] px-5 py-3 text-sm font-semibold text-brand-black"
            >
              <Send className="size-4" /> Telegram Channel
            </a>
          </div>
        </div>
        <div className="rounded-sm bg-white p-6 text-foreground sm:p-8">
          <EnquiryForm source="contact_page" />
        </div>
      </div>
    </section>
  );
}
