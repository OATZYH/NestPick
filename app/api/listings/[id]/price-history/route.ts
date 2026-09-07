import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializePriceHistory } from "@/lib/serializers/listing";
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

    const created = await prisma.priceHistory.create({
      data: {
        id: body.id || `price-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        listing_id,
        rent: new Prisma.Decimal(body.rent || 0),
        deposit: new Prisma.Decimal(body.deposit || 0),
        advance: new Prisma.Decimal(body.advance || 0),
        common_fee: new Prisma.Decimal(body.common_fee || 0),
        parking_fee: new Prisma.Decimal(body.parking_fee || 0),
        internet_fee: new Prisma.Decimal(body.internet_fee || 0),
        water_type: body.water_type || "metered",
        water_rate: body.water_rate || null,
        electric_type: body.electric_type || "government",
        electric_rate: body.electric_rate || null,
        recorded_at: body.recorded_at ? new Date(body.recorded_at) : new Date(),
        note: body.note || null,
      },
    });

    return NextResponse.json(serializePriceHistory(created), { status: 201 });
  } catch (error) {
    console.error(`Failed to add price history for listing ${listing_id}:`, error);
    return NextResponse.json(
      { error: "Failed to add price history" },
      { status: 500 }
    );
  }
}
