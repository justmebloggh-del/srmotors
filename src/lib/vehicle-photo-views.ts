/** Standard photo angles for a listing; the first five are what buyers expect to see. */
export const PHOTO_VIEWS = [
  "Front view",
  "Rear view",
  "Side view",
  "Interior",
  "Dashboard",
  "Left side",
  "Right side",
  "Front 3/4 view",
  "Rear 3/4 view",
  "Rear seats",
  "Boot / trunk",
  "Engine",
  "Wheels",
  "Detail",
] as const;

export const RECOMMENDED_VIEWS = PHOTO_VIEWS.slice(0, 5);

/**
 * Photo alt text is stored as "<vehicle title> — <view>". Returns the view part,
 * or null when the photo hasn't been labelled.
 */
export function viewFromAltText(altText: string | null | undefined): string | null {
  const parts = (altText ?? "").split(" — ");
  if (parts.length < 2) return null;
  const view = parts[parts.length - 1].trim();
  return view && !/sample photo/i.test(view) ? view : null;
}

export function altTextForView(vehicleTitle: string, view: string | null): string {
  return view ? `${vehicleTitle} — ${view}` : vehicleTitle;
}
