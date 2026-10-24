import Link from "next/link";
import { Button } from "@/components/ui/button";
import { importProcessSteps } from "@/lib/import-process-steps";

export function ImportProcessPreview() {
  return (
    <section className="bg-brand-charcoal py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">How Importing Works</h2>
            <p className="mt-2 max-w-xl text-brand-grey">
              A straightforward, transparent process from browsing to collection in Ghana.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
            <Link href="/import-process">See full process</Link>
          </Button>
        </div>

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {importProcessSteps.slice(0, 4).map((s) => (
            <li key={s.step} className="rounded-sm border border-white/10 p-5">
              <span className="text-3xl font-bold text-brand-gold">{s.step}</span>
              <h3 className="mt-3 mb-1.5 font-semibold">{s.title}</h3>
              <p className="text-sm text-brand-grey">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
