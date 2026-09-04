import { auth } from "@/lib/auth";
import {
  buildSimilaritySearchInput,
  findSimilarFixes,
} from "@/lib/fix-similarity";
import { prisma } from "@/lib/prisma";

const MAX_QUERY_LENGTH = 1_000;
const candidateSelect = {
  id: true,
  title: true,
  problem: true,
  errorMessage: true,
  cause: true,
  solution: true,
  tags: true,
  category: true,
  visibility: true,
  updatedAt: true,
  user: { select: { name: true } },
} as const;

export async function POST(request: Request) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify community search session:", error);

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
    const [ownCandidates, communityCandidates] = await Promise.all([
      prisma.fix.findMany({
        where: { userId: session.user.id },
        select: candidateSelect,
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
      prisma.fix.findMany({
        where: {
          visibility: "PUBLIC",
          userId: { not: session.user.id },
        },
        select: candidateSelect,
        orderBy: { updatedAt: "desc" },
        take: 300,
      }),
    ]);

    const input = buildSimilaritySearchInput(query);
    const ownCandidatesById = new Map(
      ownCandidates.map((candidate) => [candidate.id, candidate]),
    );
    const communityCandidatesById = new Map(
      communityCandidates.map((candidate) => [candidate.id, candidate]),
    );

    const ownMatches = findSimilarFixes(input, ownCandidates, 5).flatMap((match) => {
      const candidate = ownCandidatesById.get(match.id);

      if (!candidate) {
        return [];
      }

      return [{ ...match, updatedAt: candidate.updatedAt }];
    });
    const communityMatches = findSimilarFixes(input, communityCandidates, 10).flatMap((match) => {
      const candidate = communityCandidatesById.get(match.id);

      if (!candidate) {
        return [];
      }

      return [{
        ...match,
        updatedAt: candidate.updatedAt,
        authorName: candidate.user.name,
      }];
    });

    return Response.json({ ownMatches, communityMatches });
  } catch (error) {
    console.error("Unable to search community fixes:", error);

    return Response.json({ error: "Unable to search fixes" }, { status: 500 });
  }
}
