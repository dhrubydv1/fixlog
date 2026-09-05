import { auth } from "@/lib/auth";
import { notificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify notification session:", error);

    return Response.json(
      { error: "Unable to verify session" },
      { status: 500, headers: privateHeaders },
    );
  }

  if (!session?.user.id) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: privateHeaders },
    );
  }

  const { id } = await params;
  const notificationId = Number(id);

  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(notificationId) ||
    notificationId < 1 ||
    notificationId > 2_147_483_647
  ) {
    return Response.json(
      { error: "Invalid notification id" },
      { status: 400, headers: privateHeaders },
    );
  }

  try {
    const ownerWhere = { id: notificationId, userId: session.user.id };
    const [, notification] = await prisma.$transaction([
      prisma.notification.updateMany({
        where: { ...ownerWhere, readAt: null },
        data: { readAt: new Date() },
      }),
      prisma.notification.findFirst({
        where: ownerWhere,
        select: notificationSelect,
      }),
    ]);

    if (!notification) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404, headers: privateHeaders },
      );
    }

    return Response.json({ notification }, { headers: privateHeaders });
  } catch (error) {
    console.error("Unable to mark notification as read:", error);

    return Response.json(
      { error: "Unable to mark notification as read. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}
