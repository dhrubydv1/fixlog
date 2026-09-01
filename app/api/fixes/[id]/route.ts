import { prisma } from "@/lib/prisma";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecordNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const fix = await prisma.fix.update({
      where: { id: fixId },
      data: {
        title,
        problem,
        errorMessage: optionalString(body.errorMessage),
        cause: optionalString(body.cause),
        solution,
        tags: optionalString(body.tags),
      },
    });

    return Response.json(fix, { status: 200 });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    console.error("Unable to update fix:", error);

    return Response.json({ error: "Unable to update fix" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    return Response.json({ error: "Invalid fix id" }, { status: 400 });
  }

  try {
    await prisma.fix.delete({
      where: { id: fixId },
    });

    return Response.json({ message: "Fix deleted" }, { status: 200 });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    console.error("Unable to delete fix:", error);

    return Response.json({ error: "Unable to delete fix" }, { status: 500 });
  }
}
