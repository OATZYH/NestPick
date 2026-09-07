import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeCenterPoint } from "@/lib/serializers/listing";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const centerPoints = await prisma.centerPoint.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(centerPoints.map(serializeCenterPoint));
  } catch (error) {
    console.error("Failed to fetch center points:", error);
    return NextResponse.json(
      { error: "Failed to fetch center points" },
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

    const id = body.id || `cp-${Date.now()}`;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await prisma.centerPoint.create({
      data: {
        id,
        name,
        lat: Number(body.lat) || 13.745,
        lng: Number(body.lng) || 100.54,
        category: body.category || "landmark",
        icon: body.icon || null,
        color: body.color || null,
      },
    });

    return NextResponse.json(serializeCenterPoint(created), { status: 201 });
  } catch (error) {
    console.error("Failed to create center point:", error);
    return NextResponse.json(
      { error: "Failed to create center point" },
      { status: 500 }
    );
  }
}
