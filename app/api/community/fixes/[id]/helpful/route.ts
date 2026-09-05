import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { createOwnerNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify helpful-vote session:", error);

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
    const fix = await prisma.fix.findFirst({
      where: {
        id: fixId,
        visibility: "PUBLIC",
      },
      select: { userId: true, title: true },
    });

    if (!fix) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    if (fix.userId === session.user.id) {
      return Response.json(
        { error: "You cannot vote on your own Fix." },
        { status: 409 },
      );
    }

    const voteWhere = {
      userId_fixId: {
        userId: session.user.id,
        fixId,
      },
    };
    const existingVote = await prisma.helpfulVote.findUnique({
      where: voteWhere,
      select: { id: true },
    });

    if (existingVote) {
      try {
        await prisma.helpfulVote.delete({ where: voteWhere });
      } catch (error) {
        if (!isPrismaError(error, "P2025")) {
          throw error;
        }
      }
    } else {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.helpfulVote.create({
            data: {
              userId: session.user.id,
              fixId,
            },
          });
          await createOwnerNotification(tx, {
            ownerId: fix.userId,
            actorId: session.user.id,
            type: "HELPFUL_VOTE",
            fixId,
            fixTitle: fix.title,
          });
        });
      } catch (error) {
        if (!isPrismaError(error, "P2002")) {
          throw error;
        }
      }
    }

    const [helpfulCount, currentVote] = await Promise.all([
      prisma.helpfulVote.count({ where: { fixId } }),
      prisma.helpfulVote.findUnique({
        where: voteWhere,
        select: { id: true },
      }),
    ]);

    return Response.json({
      helpful: Boolean(currentVote),
      helpfulCount,
    });
  } catch (error) {
    console.error("Unable to update helpful vote:", error);

    return Response.json({ error: "Unable to update helpful vote" }, { status: 500 });
  }
}
