export const siteConfig = {
  name: "SR MOTORS",
  tagline: "Driven by Trust. Defined by Quality.",
  description:
    "SR Motors helps customers in Ghana source quality vehicles and arrange transparent imports — real FOB pricing, honest shipping and customs guidance, and a straightforward buying process.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://srmotors.example.com",
  contact: {
    email: "srmotors@gmail.com",
    whatsappDisplay: "+233 54 468 9472",
    whatsappE164: "233545689472",
    telegramChannel: "https://t.me/srmotorsghana",
    whatsappChannel: "https://whatsapp.com/channel/0029VbEGwfpLNSZvq9P0V20Y",
  },
  social: {
    facebook: "",
    instagram: "",
    tiktok: "",
    x: "",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Browse Cars", href: "/vehicles" },
    { label: "Brands", href: "/brands" },
    { label: "Import Process", href: "/import-process" },
    { label: "Import Cost Calculator", href: "/import-calculator" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legalNav: [
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Shipping & Import Guidance", href: "/import-process" },
  ],
} as const;

export const fobDisclaimer =
  "IMPORTANT: The listed vehicle price is FOB only. Shipping, Ghana Customs duty, port charges, clearing fees and other applicable local costs are additional. Contact SR MOTORS for a current import-cost estimate.";

export const customsDisclaimer =
  "Customs duty and clearance figures shown on this website are estimates only and are not an official customs assessment. Final duties, taxes and applicable charges are determined during the official clearance process in Ghana. Please confirm the latest figures before making a purchase.";

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${siteConfig.contact.whatsappE164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function vehicleWhatsappMessage(params: {
  title: string;
  year: number;
  fobAmount: number;
  fobCurrency: string;
  url: string;
}) {
  return `Hello SR Motors, I'm interested in the ${params.year} ${params.title} (FOB ${params.fobCurrency} ${params.fobAmount.toLocaleString()}). Listing: ${params.url}`;
}
