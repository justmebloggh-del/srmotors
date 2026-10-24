import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getFaqs } from "@/lib/data/content";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about buying and importing a vehicle through SR Motors.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {faqs.length > 0 && (
         
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <h1 className="text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h1>

      {faqs.length === 0 ? (
        <p className="mt-10 text-muted-foreground">FAQs will appear here soon.</p>
      ) : (
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
