import { Info } from "lucide-react";
import { fobDisclaimer } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function FobNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-sm border border-brand-gold/30 bg-brand-gold/5 px-4 py-3 text-sm text-brand-charcoal",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-brand-gold" />
      <p>{fobDisclaimer}</p>
    </div>
  );
}
