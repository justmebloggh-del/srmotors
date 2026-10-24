"use client";

import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site-config";

export function SocialPostGenerator({
  brandName,
  modelName,
  trim,
  year,
  fobAmount,
  fobCurrency,
  conditionLabel,
  slug,
}: {
  brandName: string;
  modelName: string;
  trim?: string | null;
  year: number;
  fobAmount: number;
  fobCurrency: string;
  conditionLabel: string;
  slug?: string;
}) {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const title = `${year} ${brandName} ${modelName}${trim ? ` ${trim}` : ""}`.trim();
    const link = slug ? `${siteConfig.url}/vehicles/${slug}` : "(publish the listing to get a link)";
    const price = fobAmount ? `${fobCurrency} ${fobAmount.toLocaleString()}` : "—";

    return [
      `🚗 ${title}`,
      `Condition: ${conditionLabel}`,
      `FOB Price: ${price} (shipping & Ghana import costs additional — ask us for a current estimate)`,
      ``,
      `View full details: ${link}`,
      ``,
      `📲 WhatsApp: ${siteConfig.contact.whatsappDisplay}`,
      `✈️ Telegram: ${siteConfig.contact.telegramChannel}`,
      `${siteConfig.name} — ${siteConfig.tagline}`,
    ].join("\n");
  }, [brandName, modelName, trim, year, fobAmount, fobCurrency, conditionLabel, slug]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A ready-to-copy promotional post for sharing this vehicle on WhatsApp, Telegram or
        social media.
      </p>
      <Textarea readOnly value={text} rows={10} className="font-mono text-sm" />
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy Post Text"}
      </Button>
    </div>
  );
}
