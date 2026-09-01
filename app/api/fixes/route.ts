import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fixes = await prisma.fix.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json(fixes, { status: 200 });
  } catch (error) {
    console.error("Unable to load fixes:", error);

    return Response.json({ error: "Unable to load fixes" }, { status: 500 });
  }
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
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

  if (!title || !problem || !solution) {
    return Response.json(
      { error: "Title, problem, and solution are required" },
      { status: 400 },
    );
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
      },
    });

    return Response.json(fix, { status: 201 });
  } catch (error) {
    console.error("Unable to create fix:", error);

    return Response.json({ error: "Unable to create fix" }, { status: 500 });
  }
}
