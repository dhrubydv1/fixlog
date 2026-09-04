import {
  FixSuggestionError,
  semanticSearchFixes,
} from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_QUERY_LENGTH = 1_000;

export async function POST(request: Request) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify semantic search session:", error);

    return Response.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session?.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query: string;

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body) || typeof (body as { query?: unknown }).query !== "string") {
      throw new Error("Invalid request body");
    }

    query = (body as { query: string }).query.trim();
  } catch {
    return Response.json({ error: "Enter a search query." }, { status: 400 });
  }

  if (!query) {
    return Response.json({ error: "Enter a search query." }, { status: 400 });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json({ error: "Search query is too long." }, { status: 400 });
  }

  try {
    const candidates = await prisma.fix.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        problem: true,
        errorMessage: true,
        cause: true,
        solution: true,
        tags: true,
        category: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const result = await semanticSearchFixes(query, candidates);

    if (!result.configured) {
      return Response.json(result, { status: 503 });
    }

    const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    const matches = result.matches.flatMap((match) => {
      const candidate = candidatesById.get(match.id);

      if (!candidate) {
        return [];
      }

      return [{
        id: candidate.id,
        title: candidate.title,
        problem: candidate.problem,
        errorMessage: candidate.errorMessage,
        category: candidate.category,
        tags: candidate.tags,
        score: match.score,
        reason: match.reason,
      }];
    });

    return Response.json({ configured: true, matches });
  } catch (error) {
    if (error instanceof FixSuggestionError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("Unable to search fixes with AI:", error);

    return Response.json({ error: "AI search is temporarily unavailable." }, { status: 500 });
  }
}
