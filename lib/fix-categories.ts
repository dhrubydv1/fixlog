export const FIX_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Authentication",
  "API",
  "Deployment",
  "DevOps",
  "Git/GitHub",
  "Other",
] as const;

export type FixCategory = (typeof FIX_CATEGORIES)[number];

export function parseFixCategory(value: unknown): FixCategory | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return typeof value === "string" && (FIX_CATEGORIES as readonly string[]).includes(value)
    ? (value as FixCategory)
    : undefined;
}
