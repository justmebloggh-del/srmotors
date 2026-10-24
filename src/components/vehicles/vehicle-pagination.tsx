import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function VehiclePagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value == null) continue;
      params.set(key, Array.isArray(value) ? value.join(",") : value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return `/vehicles${qs ? `?${qs}` : ""}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1 py-10" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "flex size-9 items-center justify-center rounded-sm border border-border",
          page === 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

      {pages.map((p, idx) => (
        <span key={p} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Link
            href={hrefFor(p)}
            className={cn(
              "flex size-9 items-center justify-center rounded-sm border text-sm",
              p === page
                ? "border-brand-gold bg-brand-gold text-brand-black font-semibold"
                : "border-border hover:bg-muted",
            )}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          "flex size-9 items-center justify-center rounded-sm border border-border",
          page === totalPages && "pointer-events-none opacity-40",
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
