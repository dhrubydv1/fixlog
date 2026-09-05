export const FIX_REPORT_REASONS = [
  "SECRET_EXPOSURE",
  "SPAM",
  "ABUSIVE",
  "MISLEADING",
  "PRIVATE_INFORMATION",
  "OTHER",
] as const;

export type FixReportReason = (typeof FIX_REPORT_REASONS)[number];

export function isFixReportReason(value: unknown): value is FixReportReason {
  return typeof value === "string" && (FIX_REPORT_REASONS as readonly string[]).includes(value);
}
