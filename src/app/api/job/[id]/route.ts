import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        pages: {
          select: {
            id: true,
            url: true,
            title: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const response: {
      id: string;
      domain: string;
      status: string;
      category: string | null;
      pageCount: number;
      createdAt: Date;
      updatedAt: Date;
      issueNumber?: number;
      issueUrl?: string;
      blueprintUrl?: string | null;
      tokensUrl?: string | null;
      prUrl?: string | null;
    } = {
      id: job.id,
      domain: job.domain,
      status: job.status,
      category: job.category,
      pageCount: job.pages.length,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    if (job.issueNumber) {
      response.issueNumber = job.issueNumber;
      response.issueUrl = `https://github.com/${process.env.GITHUB_REPO}/issues/${job.issueNumber}`;
    }

    if (job.blueprintUrl) {
      response.blueprintUrl = job.blueprintUrl;
    }

    if (job.tokensUrl) {
      response.tokensUrl = job.tokensUrl;
    }

    if (job.prUrl) {
      response.prUrl = job.prUrl;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Job API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
