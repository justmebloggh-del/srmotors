import type { Metadata } from "next";
import { getContentBlock } from "@/lib/data/content";

// Served from cache and regenerated at most every 5 minutes; admin edits revalidate immediately.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/legal/privacy-policy" },
  robots: { index: true, follow: true },
};

export default async function PrivacyPolicyPage() {
  const content = await getContentBlock("privacy_policy");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">{content?.title ?? "Privacy Policy"}</h1>
      <div className="mt-6 max-w-none whitespace-pre-line leading-relaxed text-muted-foreground">
        {content?.body ?? "This page will be updated with SR Motors' privacy policy shortly."}
      </div>
    </div>
  );
}
