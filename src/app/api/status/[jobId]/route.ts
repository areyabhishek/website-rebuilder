import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const { jobId } = params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const repo = process.env.GITHUB_REPO;

    return NextResponse.json({
      jobId: job.id,
      domain: job.domain,
      designDomain: job.designDomain,
      designLanguage: job.designLanguage,
      status: job.status,
      category: job.category,
      issueNumber: job.issueNumber ?? undefined,
      issueUrl:
        repo && job.issueNumber
          ? `https://github.com/${repo}/issues/${job.issueNumber}`
          : undefined,
      prUrl: job.prUrl ?? undefined,
      previewUrl: job.previewUrl ?? undefined,
      deploymentId: job.deploymentId ?? undefined,
      actionStatus: null,
    });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve job status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
