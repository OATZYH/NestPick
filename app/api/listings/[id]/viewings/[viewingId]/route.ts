import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeViewingLog } from "@/lib/serializers/listing";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; viewingId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listing_id, viewingId } = await params;

  try {
    const body = await req.json();

    const data: Prisma.ViewingLogUpdateInput = {};
    if (typeof body.completed === "boolean") {
      data.completed = body.completed;
    }
    if (body.rating !== undefined) {
      data.rating = body.rating !== null ? new Prisma.Decimal(body.rating) : null;
    }
    if (typeof body.notes === "string") {
      data.notes = body.notes;
    }
    if (body.scheduled_at) {
      data.scheduled_at = new Date(body.scheduled_at);
    }

    const updated = await prisma.viewingLog.update({
      where: {
        id: viewingId,
        listing_id,
      },
      data,
    });

    return NextResponse.json(serializeViewingLog(updated));
  } catch (error) {
    console.error(`Failed to update viewing log ${viewingId}:`, error);
    return NextResponse.json(
      { error: "Failed to update viewing log" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; viewingId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listing_id, viewingId } = await params;

  try {
    await prisma.viewingLog.delete({
      where: {
        id: viewingId,
        listing_id,
      },
    });

    return NextResponse.json({ success: true, id: viewingId, listing_id });
  } catch (error) {
    console.error(`Failed to delete viewing log ${viewingId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete viewing log" },
      { status: 500 }
    );
  }
}
