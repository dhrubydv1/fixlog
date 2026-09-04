import { auth } from "@/lib/auth";
import { parseFixCategory, type FixCategory } from "@/lib/fix-categories";
import { parseFixVisibility, type FixVisibility } from "@/lib/fix-visibility";
import { prisma } from "@/lib/prisma";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasOwnProperty(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
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

  const updateData: {
    title?: string;
    problem?: string;
    errorMessage?: string | null;
    cause?: string | null;
    solution?: string;
    tags?: string | null;
    category?: FixCategory | null;
    isFavorite?: boolean;
    visibility?: FixVisibility;
  } = {};

  for (const field of ["title", "problem", "solution"] as const) {
    if (!hasOwnProperty(body, field)) {
      continue;
    }

    const value = optionalString(body[field]);

    if (!value) {
      return Response.json({ error: `${field} is required` }, { status: 400 });
    }

    updateData[field] = value;
  }

  for (const field of ["errorMessage", "cause", "tags"] as const) {
    if (hasOwnProperty(body, field)) {
      updateData[field] = optionalString(body[field]);
    }
  }

  if (hasOwnProperty(body, "category")) {
    const category = parseFixCategory(body.category);

    if (category === undefined) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }

    updateData.category = category;
  }

  if (hasOwnProperty(body, "isFavorite")) {
    if (typeof body.isFavorite !== "boolean") {
      return Response.json({ error: "isFavorite must be a boolean" }, { status: 400 });
    }

    updateData.isFavorite = body.isFavorite;
  }

  if (hasOwnProperty(body, "visibility")) {
    const visibility = parseFixVisibility(body.visibility);

    if (!visibility) {
      return Response.json({ error: "Invalid visibility" }, { status: 400 });
    }

    updateData.visibility = visibility;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fix fields provided" }, { status: 400 });
  }

  try {
    const updatedFixes = await prisma.fix.updateMany({
      where: {
        id: fixId,
        userId: session.user.id,
      },
      data: updateData,
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
    const errorId = crypto.randomUUID();

    console.error(`Unable to update fix [${errorId}]:`, error);

    return Response.json(
      {
        error: "We couldn't save this fix. Please try again.",
        code: "FIX_UPDATE_FAILED",
        errorId,
      },
      { status: 500 },
    );
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
