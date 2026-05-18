/**
 * Price helpers — every monetary value the backend returns is in **tiyin**
 * (UZS × 100), so display surfaces need to divide before formatting and
 * editor inputs need to multiply on save.
 */

const locale = "uz-UZ";

export function tiyinToSum(tiyin: number | null | undefined): number {
  if (tiyin == null) return 0;
  return tiyin / 100;
}

export function sumToTiyin(sum: number | null | undefined): number {
  if (sum == null) return 0;
  return Math.round(sum * 100);
}

/**
 * Format a tiyin amount as a localized UZS string. By default no currency
 * suffix is appended so callers can place "UZS" / "сум" themselves where it
 * already lives in the markup.
 */
export function formatUZS(
  tiyin: number | null | undefined,
  opts: { suffix?: string } = {},
): string {
  const sum = tiyinToSum(tiyin);
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(sum);
  return opts.suffix ? `${formatted} ${opts.suffix}` : formatted;
}
