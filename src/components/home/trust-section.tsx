import { ShieldCheck, FileText, MessageSquare } from "lucide-react";

const items = [
  {
    icon: FileText,
    title: "Transparent Pricing",
    body: "Every listing shows the real FOB price with no hidden mark-ups, and we explain exactly what gets added on top before you commit.",
  },
  {
    icon: ShieldCheck,
    title: "Honest Vehicle Condition",
    body: "Condition notes are written for each vehicle so you know what you're buying before you ask us to proceed.",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    body: "Talk to us directly on WhatsApp, Telegram or email throughout the process — no call centres, no scripts.",
  },
];

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="mb-10 text-2xl font-bold sm:text-3xl">Why Customers Work With SR Motors</h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-sm border border-border p-6">
            <item.icon className="mb-3 size-7 text-brand-gold" />
            <h3 className="mb-2 font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
