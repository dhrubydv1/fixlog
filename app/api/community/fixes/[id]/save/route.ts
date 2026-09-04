import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify save-community-fix session:", error);

    return Response.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session?.user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    return Response.json({ error: "Fix not found" }, { status: 404 });
  }

  try {
    const sourceFix = await prisma.fix.findFirst({
      where: {
        id: fixId,
        visibility: "PUBLIC",
      },
      select: {
        userId: true,
        title: true,
        problem: true,
        errorMessage: true,
        cause: true,
        solution: true,
        tags: true,
        category: true,
      },
    });

    if (!sourceFix) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    if (sourceFix.userId === session.user.id) {
      return Response.json(
        { error: "This Fix already belongs to you." },
        { status: 409 },
      );
    }

    const savedFix = await prisma.fix.create({
      data: {
        title: sourceFix.title,
        problem: sourceFix.problem,
        errorMessage: sourceFix.errorMessage,
        cause: sourceFix.cause,
        solution: sourceFix.solution,
        tags: sourceFix.tags,
        category: sourceFix.category,
        userId: session.user.id,
        visibility: "PRIVATE",
        isFavorite: false,
      },
      select: { id: true },
    });

    return Response.json({ id: savedFix.id }, { status: 201 });
  } catch (error) {
    console.error("Unable to save community fix:", error);

    return Response.json({ error: "Unable to save this Fix" }, { status: 500 });
  }
}
