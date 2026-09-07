import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [propertyTypes, pipelineStatuses] = await Promise.all([
      prisma.propertyType.findMany({ orderBy: { id: "asc" } }),
      prisma.pipelineStatus.findMany({ orderBy: { id: "asc" } }),
    ]);

    return NextResponse.json({
      propertyTypes,
      pipelineStatuses,
    });
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
