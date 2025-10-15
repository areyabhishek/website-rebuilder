import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, prompt, issueNumber } = body;

    if (!jobId || !prompt) {
      return NextResponse.json(
        { error: "jobId and prompt are required" },
        { status: 400 }
      );
    }

    // Get the job details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Create a GitHub issue for the styling request
    const stylingIssueNumber = await createIssue(
      job.domain,
      job.category || "portfolio",
      job.blueprintUrl || "",
      job.tokensUrl || "",
      job.componentsUrl || undefined,
      "Styling update request"
    );

    // Add a comment to the issue with styling instructions
    const { Octokit } = await import("@octokit/rest");
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const [owner, repo] = (process.env.GITHUB_REPO || "").split("/");

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: stylingIssueNumber,
      body: `## Styling Request

**Original Issue:** ${issueNumber ? `#${issueNumber}` : "N/A"}
**Job ID:** ${jobId}

### Requested Changes:
${prompt}

---

**Instructions for Generation:**
This is a styling-only update. Use the \`stylingOnlyPrompt\` from the config file and apply ONLY CSS changes. Do not modify HTML structure or content.
`,
    });

    return NextResponse.json({
      success: true,
      issueNumber: stylingIssueNumber,
      issueUrl: `https://github.com/${process.env.GITHUB_REPO}/issues/${stylingIssueNumber}`,
    });
  } catch (error) {
    console.error("Restyle API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create styling request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
