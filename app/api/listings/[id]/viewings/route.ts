import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeViewingLog } from "@/lib/serializers/listing";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listing_id } = await params;

  try {
    const body = await req.json();

    const created = await prisma.viewingLog.create({
      data: {
        id: body.id || `viewing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        listing_id,
        scheduled_at: body.scheduled_at ? new Date(body.scheduled_at) : new Date(),
        notes: body.notes || "",
        rating: body.rating ? new Prisma.Decimal(body.rating) : null,
        completed: Boolean(body.completed),
      },
    });

    return NextResponse.json(serializeViewingLog(created), { status: 201 });
  } catch (error) {
    console.error(`Failed to add viewing log for listing ${listing_id}:`, error);
    return NextResponse.json(
      { error: "Failed to add viewing log" },
      { status: 500 }
    );
  }
}
