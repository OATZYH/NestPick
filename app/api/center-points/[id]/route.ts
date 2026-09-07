import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeCenterPoint } from "@/lib/serializers/listing";

export const dynamic = "force-dynamic";

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

    const updated = await prisma.centerPoint.update({
      where: { id },
      data: {
        name: body.name,
        lat: Number(body.lat) || 13.745,
        lng: Number(body.lng) || 100.54,
        category: body.category,
        icon: body.icon || null,
        color: body.color || null,
      },
    });

    return NextResponse.json(serializeCenterPoint(updated));
  } catch (error) {
    console.error(`Failed to update center point ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update center point" },
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
    await prisma.centerPoint.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error(`Failed to delete center point ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete center point" },
      { status: 500 }
    );
  }
}
