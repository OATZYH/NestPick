import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeContract } from "@/lib/serializers/listing";

export const dynamic = "force-dynamic";

export async function PUT(
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

    const upserted = await prisma.contract.upsert({
      where: { listing_id },
      update: {
        start_date: new Date(body.start_date || new Date()),
        end_date: new Date(body.end_date || new Date()),
        duration_months: Number(body.duration_months) || 12,
        deposit_refund_terms: body.deposit_refund_terms || null,
        pet_allowed: Boolean(body.pet_allowed),
        smoking_allowed: Boolean(body.smoking_allowed),
        guest_allowed: Boolean(body.guest_allowed),
        early_termination_penalty: body.early_termination_penalty || null,
        contract_file_url: body.contract_file_url || null,
      },
      create: {
        id: body.id || `contract-${listing_id}`,
        listing_id,
        start_date: new Date(body.start_date || new Date()),
        end_date: new Date(body.end_date || new Date()),
        duration_months: Number(body.duration_months) || 12,
        deposit_refund_terms: body.deposit_refund_terms || null,
        pet_allowed: Boolean(body.pet_allowed),
        smoking_allowed: Boolean(body.smoking_allowed),
        guest_allowed: Boolean(body.guest_allowed),
        early_termination_penalty: body.early_termination_penalty || null,
        contract_file_url: body.contract_file_url || null,
      },
    });

    return NextResponse.json(serializeContract(upserted));
  } catch (error) {
    console.error(`Failed to upsert contract for listing ${listing_id}:`, error);
    return NextResponse.json(
      { error: "Failed to save contract" },
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

  const { id: listing_id } = await params;

  try {
    await prisma.contract.delete({
      where: { listing_id },
    });

    return NextResponse.json({ success: true, listing_id });
  } catch (error) {
    console.error(`Failed to delete contract for listing ${listing_id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
