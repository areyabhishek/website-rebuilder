import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabaseId = searchParams.get("supabaseId");

    if (!supabaseId) {
      return NextResponse.json(
        { error: "Missing supabaseId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: { credits: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ credits: user.credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}
