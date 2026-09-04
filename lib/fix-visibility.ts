export const FIX_VISIBILITIES = ["PRIVATE", "PUBLIC"] as const;

export type FixVisibility = (typeof FIX_VISIBILITIES)[number];

export function parseFixVisibility(value: unknown): FixVisibility | undefined {
  return typeof value === "string" && (FIX_VISIBILITIES as readonly string[]).includes(value)
    ? (value as FixVisibility)
    : undefined;
}
