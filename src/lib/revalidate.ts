import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages are cached (ISR). Any admin change that can affect them —
 * listings, prices, rates, content — clears the whole public cache so the
 * site reflects it on the next visit. The site is small enough that
 * targeted invalidation isn't worth the risk of missing a page.
 */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
}
