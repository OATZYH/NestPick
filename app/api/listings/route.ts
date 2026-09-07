import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serializers/listing";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const favorite = searchParams.get("favorite");

  const where: Prisma.ListingWhereInput = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (type && type !== "all") {
    where.type = type;
  }
  if (favorite === "true") {
    where.is_favorite = true;
  }

  try {
    const listings = await prisma.listing.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        priceHistory: {
          orderBy: { recorded_at: "asc" },
        },
        contract: true,
        viewingLogs: {
          orderBy: { scheduled_at: "desc" },
        },
      },
    });

    const serialized = listings.map(serializeListing);
    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const id = body.id || `condo-${Date.now()}`;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const type = body.type || "condo";
    const status = body.status || "interested";

    // Ensure foreign key types exist
    const [propertyType, pipelineStatus] = await Promise.all([
      prisma.propertyType.findUnique({ where: { id: type } }),
      prisma.pipelineStatus.findUnique({ where: { id: status } }),
    ]);

    if (!propertyType) {
      return NextResponse.json(
        { error: `Invalid property type: ${type}` },
        { status: 400 }
      );
    }
    if (!pipelineStatus) {
      return NextResponse.json(
        { error: `Invalid pipeline status: ${status}` },
        { status: 400 }
      );
    }

    const created = await prisma.listing.create({
      data: {
        id,
        name,
        address: body.address || "",
        lat: Number(body.lat) || 13.7563,
        lng: Number(body.lng) || 100.5018,
        type,
        size_sqm: new Prisma.Decimal(body.size_sqm || 30),
        floor: Number(body.floor) || 1,
        view: body.view || null,
        source_url: body.source_url || null,
        contact_phone: body.contact_phone || null,
        contact_line: body.contact_line || null,
        status,
        is_favorite: Boolean(body.is_favorite),
        created_at: body.created_at ? new Date(body.created_at) : new Date(),
        notes: body.notes || "",
        amenities: body.amenities || {},
        photos: Array.isArray(body.photos) ? body.photos : [],
        // If initial price history is provided
        priceHistory: Array.isArray(body.price_history) && body.price_history.length > 0
          ? {
              create: body.price_history.map((p: any) => ({
                id: p.id || `price-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                rent: new Prisma.Decimal(p.rent || 0),
                deposit: new Prisma.Decimal(p.deposit || 0),
                advance: new Prisma.Decimal(p.advance || 0),
                common_fee: new Prisma.Decimal(p.common_fee || 0),
                parking_fee: new Prisma.Decimal(p.parking_fee || 0),
                internet_fee: new Prisma.Decimal(p.internet_fee || 0),
                water_type: p.water_type || "metered",
                water_rate: p.water_rate || null,
                electric_type: p.electric_type || "government",
                electric_rate: p.electric_rate || null,
                recorded_at: p.recorded_at ? new Date(p.recorded_at) : new Date(),
                note: p.note || null,
              })),
            }
          : undefined,
        // If contract is provided
        contract: body.contract
          ? {
              create: {
                id: body.contract.id || `contract-${id}`,
                start_date: new Date(body.contract.start_date || new Date()),
                end_date: new Date(body.contract.end_date || new Date()),
                duration_months: Number(body.contract.duration_months) || 12,
                deposit_refund_terms: body.contract.deposit_refund_terms || null,
                pet_allowed: Boolean(body.contract.pet_allowed),
                smoking_allowed: Boolean(body.contract.smoking_allowed),
                guest_allowed: Boolean(body.contract.guest_allowed),
                early_termination_penalty: body.contract.early_termination_penalty || null,
                contract_file_url: body.contract.contract_file_url || null,
              },
            }
          : undefined,
      },
      include: {
        priceHistory: {
          orderBy: { recorded_at: "asc" },
        },
        contract: true,
        viewingLogs: {
          orderBy: { scheduled_at: "desc" },
        },
      },
    });

    return NextResponse.json(serializeListing(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}
