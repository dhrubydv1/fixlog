import { auth } from "@/lib/auth";
import { parseFixCategory, type FixCategory } from "@/lib/fix-categories";
import { findSimilarFixes, type SimilarFixInput } from "@/lib/fix-similarity";
import { prisma } from "@/lib/prisma";

const MAX_LENGTHS = {
  title: 160,
  problem: 10_000,
  errorMessage: 10_000,
  cause: 4_000,
  solution: 8_000,
  tags: 500,
} as const;

function readOptionalText(
  body: Record<string, unknown>,
  field: keyof typeof MAX_LENGTHS,
): string | undefined {
  const value = body[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${field} must be text`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (trimmedValue.length > MAX_LENGTHS[field]) {
    throw new Error(`${field} is too long`);
  }

  return trimmedValue;
}

function readExcludeFixId(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("excludeFixId must be a valid Fix ID");
  }

  return value;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    const json = await request.json();

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("Invalid JSON body");
    }

    body = json as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  let input: SimilarFixInput;
  let excludeFixId: number | undefined;

  try {
    const category = parseFixCategory(body.category);

    if (category === undefined) {
      throw new Error("Invalid category");
    }

    input = {
      title: readOptionalText(body, "title"),
      problem: readOptionalText(body, "problem"),
      errorMessage: readOptionalText(body, "errorMessage"),
      cause: readOptionalText(body, "cause"),
      solution: readOptionalText(body, "solution"),
      tags: readOptionalText(body, "tags"),
      category: category as FixCategory | null,
    };
    excludeFixId = readExcludeFixId(body.excludeFixId);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid request input" },
      { status: 400 },
    );
  }

  if (!input.title && !input.problem && !input.errorMessage && !input.tags) {
    return Response.json(
      { error: "Provide a title, problem, error message, or tags to find similar fixes." },
      { status: 400 },
    );
  }

  try {
    const candidates = await prisma.fix.findMany({
      where: {
        userId: session.user.id,
        ...(excludeFixId ? { id: { not: excludeFixId } } : {}),
      },
      select: {
        id: true,
        title: true,
        problem: true,
        errorMessage: true,
        cause: true,
        solution: true,
        tags: true,
        category: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return Response.json({ matches: findSimilarFixes(input, candidates) });
  } catch (error) {
    console.error("Unable to find similar fixes:", error);

    return Response.json({ error: "Unable to find similar fixes" }, { status: 500 });
  }
}
