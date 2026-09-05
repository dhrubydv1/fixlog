import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { isFixReportReason } from "@/lib/fix-report-reasons";
import { prisma } from "@/lib/prisma";

const MAX_DETAILS_LENGTH = 1_000;

function optionalDetails(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || null;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;

  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error("Unable to verify report-fix session:", error);

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

  const fix = await prisma.fix.findFirst({
    where: {
      id: fixId,
      visibility: "PUBLIC",
    },
    select: { userId: true },
  });

  if (!fix) {
    return Response.json({ error: "Fix not found" }, { status: 404 });
  }

  if (fix.userId === session.user.id) {
    return Response.json(
      { error: "You cannot report your own Fix." },
      { status: 409 },
    );
  }

  let reason: unknown;
  let details: string | null | undefined;

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid request body");
    }

    const report = body as { reason?: unknown; details?: unknown };
    reason = report.reason;
    details = optionalDetails(report.details);
  } catch {
    return Response.json({ error: "Provide a report reason." }, { status: 400 });
  }

  if (!isFixReportReason(reason)) {
    return Response.json({ error: "Select a valid report reason." }, { status: 400 });
  }

  if (details === undefined) {
    return Response.json({ error: "Report details must be plain text." }, { status: 400 });
  }

  if (details && details.length > MAX_DETAILS_LENGTH) {
    return Response.json({ error: "Report details must be 1000 characters or fewer." }, { status: 400 });
  }

  const reportWhere = {
    reporterId_fixId: {
      reporterId: session.user.id,
      fixId,
    },
  };

  try {
    const existingReport = await prisma.fixReport.findUnique({
      where: reportWhere,
      select: { id: true },
    });

    if (existingReport) {
      return Response.json({ error: "You already reported this Fix." }, { status: 409 });
    }

    await prisma.fixReport.create({
      data: {
        reporterId: session.user.id,
        fixId,
        reason,
        details,
      },
    });

    return Response.json({ reported: true }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json({ error: "You already reported this Fix." }, { status: 409 });
    }

    console.error("Unable to submit Fix report:", error);

    return Response.json({ error: "Unable to submit your report" }, { status: 500 });
  }
}
