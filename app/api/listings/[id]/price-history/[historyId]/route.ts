import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; historyId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listing_id, historyId } = await params;

  try {
    await prisma.priceHistory.delete({
      where: {
        id: historyId,
        listing_id,
      },
    });

    return NextResponse.json({ success: true, id: historyId, listing_id });
  } catch (error) {
    console.error(`Failed to delete price history ${historyId}:`, error);
    return NextResponse.json(
      { error: "Failed to delete price history entry" },
      { status: 500 }
    );
  }
}
