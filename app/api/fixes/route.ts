import { auth } from "@/lib/auth";
import { parseFixCategory } from "@/lib/fix-categories";
import { prisma } from "@/lib/prisma";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fixes = await prisma.fix.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(fixes, { status: 200 });
  } catch (error) {
    console.error("Unable to load fixes:", error);

    return Response.json({ error: "Unable to load fixes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let session;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Unable to verify session:", error);

    return Response.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session) {
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

  const title = optionalString(body.title);
  const problem = optionalString(body.problem);
  const solution = optionalString(body.solution);
  const category = parseFixCategory(body.category);

  if (!title || !problem || !solution) {
    return Response.json(
      { error: "Title, problem, and solution are required" },
      { status: 400 },
    );
  }

  if (category === undefined) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const fix = await prisma.fix.create({
      data: {
        title,
        problem,
        errorMessage: optionalString(body.errorMessage),
        cause: optionalString(body.cause),
        solution,
        tags: optionalString(body.tags),
        category,
        userId: session.user.id,
      },
    });

    return Response.json(fix, { status: 201 });
  } catch (error) {
    console.error("Unable to create fix:", error);

    return Response.json({ error: "Unable to create fix" }, { status: 500 });
  }
}
