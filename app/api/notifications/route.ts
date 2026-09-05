import { auth } from "@/lib/auth";
import { getNotificationInbox } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
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

  try {
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("unreadCountOnly") === "true") {
      const unreadCount = await prisma.notification.count({
        where: { userId: session.user.id, readAt: null },
      });

      return Response.json({ unreadCount }, { headers: privateHeaders });
    }

    const inbox = await getNotificationInbox(session.user.id);

    return Response.json(inbox, { headers: privateHeaders });
  } catch (error) {
    console.error("Unable to load notifications:", error);

    return Response.json(
      { error: "Unable to load notifications. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}
