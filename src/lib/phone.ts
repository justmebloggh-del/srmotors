/**
 * Normalises a phone number to E.164 digits (no "+") for wa.me links.
 * Local Ghanaian numbers ("0244 123 456") are assumed to be +233.
 * Returns null when the input can't plausibly be a phone number.
 */
export function toWhatsAppDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 10) {
    digits = `233${digits.slice(1)}`;
  } else if (digits.length === 9) {
    digits = `233${digits}`;
  }

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}
