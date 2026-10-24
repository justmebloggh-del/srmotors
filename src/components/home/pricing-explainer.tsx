import { Ship, Receipt, Landmark } from "lucide-react";
import { FobNotice } from "@/components/shared/fob-notice";

const items = [
  {
    icon: Ship,
    title: "Shipping to Ghana",
    body: "Shipping cost depends on the vehicle's size (CBM), shipping method, and the current rate between the origin and destination port. We give you a current estimate before you commit — not a guess.",
  },
  {
    icon: Landmark,
    title: "Ghana Customs Duty & Clearance",
    body: "Ghana Customs determines the actual duty payable when your vehicle is processed for clearance. We provide an indicative estimate based on available assumptions, clearly labelled as such.",
  },
  {
    icon: Receipt,
    title: "Port Charges & Clearing Fees",
    body: "Port handling and clearing agent fees are added on top of duty. We break every one of these out individually rather than bundling them into a single vague number.",
  },
];

export function PricingExplainer() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Understanding What You Pay</h2>
        <p className="mt-3 text-muted-foreground">
          Every vehicle on SR Motors is listed at its FOB (Free On Board) price. That is what
          the vehicle itself costs — shipping, Ghana Customs duty, port charges and clearing
          fees come on top. We walk you through each of these before you buy.
        </p>
      </div>

      <FobNotice className="mb-10" />

      <div className="grid gap-8 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title}>
            <item.icon className="mb-3 size-7 text-brand-gold" />
            <h3 className="mb-2 font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
