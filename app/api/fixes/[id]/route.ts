import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    return Response.json({ error: "Invalid fix id" }, { status: 400 });
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

  if (!title || !problem || !solution) {
    return Response.json(
      { error: "Title, problem, and solution are required" },
      { status: 400 },
    );
  }

  try {
    const updatedFixes = await prisma.fix.updateMany({
      where: {
        id: fixId,
        userId: session.user.id,
      },
      data: {
        title,
        problem,
        errorMessage: optionalString(body.errorMessage),
        cause: optionalString(body.cause),
        solution,
        tags: optionalString(body.tags),
      },
    });

    if (updatedFixes.count === 0) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    const fix = await prisma.fix.findFirst({
      where: {
        id: fixId,
        userId: session.user.id,
      },
    });

    if (!fix) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    return Response.json(fix, { status: 200 });
  } catch (error) {
    console.error("Unable to update fix:", error);

    return Response.json({ error: "Unable to update fix" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    return Response.json({ error: "Invalid fix id" }, { status: 400 });
  }

  try {
    const deletedFixes = await prisma.fix.deleteMany({
      where: {
        id: fixId,
        userId: session.user.id,
      },
    });

    if (deletedFixes.count === 0) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    return Response.json({ message: "Fix deleted" }, { status: 200 });
  } catch (error) {
    console.error("Unable to delete fix:", error);

    return Response.json({ error: "Unable to delete fix" }, { status: 500 });
  }
}
