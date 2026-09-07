import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeListing } from "@/lib/serializers/listing";
import { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
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

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(serializeListing(listing));
  } catch (error) {
    console.error(`Failed to fetch listing ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const data: Prisma.ListingUpdateInput = {};

    if (typeof body.is_favorite === "boolean") {
      data.is_favorite = body.is_favorite;
    }
    if (body.status) {
      data.pipelineStatus = { connect: { id: body.status } };
    }
    if (body.type) {
      data.propertyType = { connect: { id: body.type } };
    }
    if (typeof body.notes === "string") {
      data.notes = body.notes;
    }
    if (body.amenities) {
      data.amenities = body.amenities;
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
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

    return NextResponse.json(serializeListing(updated));
  } catch (error) {
    console.error(`Failed to patch listing ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const type = body.type || "condo";
    const status = body.status || "interested";

    // Update main listing fields
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        lat: Number(body.lat) || 13.7563,
        lng: Number(body.lng) || 100.5018,
        propertyType: { connect: { id: type } },
        size_sqm: new Prisma.Decimal(body.size_sqm || 30),
        floor: Number(body.floor) || 1,
        view: body.view ?? null,
        source_url: body.source_url ?? null,
        contact_phone: body.contact_phone ?? null,
        contact_line: body.contact_line ?? null,
        pipelineStatus: { connect: { id: status } },
        is_favorite: Boolean(body.is_favorite),
        notes: body.notes ?? "",
        amenities: body.amenities ?? {},
        photos: Array.isArray(body.photos) ? body.photos : [],
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

    // If new price history entry provided in full update
    if (Array.isArray(body.price_history) && body.price_history.length > 0) {
      for (const p of body.price_history) {
        if (!p.id) continue;
        await prisma.priceHistory.upsert({
          where: { id: p.id },
          update: {
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
          },
          create: {
            id: p.id,
            listing_id: id,
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
          },
        });
      }
    }

    // If contract provided in full update
    if (body.contract) {
      await prisma.contract.upsert({
        where: { listing_id: id },
        update: {
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
        create: {
          id: body.contract.id || `contract-${id}`,
          listing_id: id,
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
      });
    }

    const reloaded = await prisma.listing.findUnique({
      where: { id },
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

    return NextResponse.json(serializeListing(reloaded));
  } catch (error) {
    console.error(`Failed to update listing ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.listing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(`Failed to delete listing ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    );
  }
}
