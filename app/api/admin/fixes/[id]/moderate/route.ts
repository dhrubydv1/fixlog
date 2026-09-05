import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createOwnerNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const MODERATION_ACTIONS = ["KEEP", "HIDE", "DELETE"] as const;
type ModerationAction = (typeof MODERATION_ACTIONS)[number];

function isModerationAction(value: unknown): value is ModerationAction {
  return typeof value === "string" && (MODERATION_ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify admin moderation session:", error);

    return Response.json({ error: "Unable to verify session" }, { status: 500 });
  }

  if (!session?.user.email || !isAdmin(session.user.email)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    return Response.json({ error: "Fix not found" }, { status: 404 });
  }

  let action: unknown;
  let confirmDelete = false;

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid request body");
    }

    const moderation = body as { action?: unknown; confirmDelete?: unknown };
    action = moderation.action;
    confirmDelete = moderation.confirmDelete === true;
  } catch {
    return Response.json({ error: "Select a moderation action." }, { status: 400 });
  }

  if (!isModerationAction(action)) {
    return Response.json({ error: "Select a valid moderation action." }, { status: 400 });
  }

  if (action === "DELETE" && !confirmDelete) {
    return Response.json({ error: "Confirm deletion before continuing." }, { status: 400 });
  }

  try {
    const fix = await prisma.fix.findFirst({
      where: {
        id: fixId,
        visibility: "PUBLIC",
      },
      select: { id: true, userId: true, title: true },
    });

    if (!fix) {
      return Response.json({ error: "Fix not found" }, { status: 404 });
    }

    if (action === "KEEP") {
      await prisma.fixReport.updateMany({
        where: {
          fixId,
          status: "OPEN",
        },
        data: { status: "DISMISSED" },
      });
    } else if (action === "HIDE") {
      await prisma.$transaction(async (tx) => {
        await tx.fix.update({
          where: { id: fixId, visibility: "PUBLIC" },
          data: { visibility: "PRIVATE" },
        });
        await tx.fixReport.updateMany({
          where: {
            fixId,
            status: "OPEN",
          },
          data: { status: "RESOLVED" },
        });
        await createOwnerNotification(tx, {
          ownerId: fix.userId,
          actorId: session.user.id,
          type: "MODERATION_HIDDEN",
          fixId,
          fixTitle: fix.title,
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        // The notification belongs to the user, so deleting the Fix preserves it.
        await createOwnerNotification(tx, {
          ownerId: fix.userId,
          actorId: session.user.id,
          type: "MODERATION_DELETED",
          fixId,
          fixTitle: fix.title,
        });
        await tx.fix.delete({ where: { id: fixId, visibility: "PUBLIC" } });
      });
    }

    return Response.json({ action }, { status: 200 });
  } catch (error) {
    console.error("Unable to moderate Fix:", error);

    return Response.json({ error: "Unable to complete moderation action" }, { status: 500 });
  }
}
