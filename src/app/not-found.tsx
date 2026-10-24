import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-brand-black px-6 text-center text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">404</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Page Not Found</h1>
      <p className="mt-3 max-w-md text-brand-grey">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild className="bg-brand-gold text-brand-black hover:bg-brand-gold-light">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
          <Link href="/vehicles">Browse Vehicles</Link>
        </Button>
      </div>
    </div>
  );
}
