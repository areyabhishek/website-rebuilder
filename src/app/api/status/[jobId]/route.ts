import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If we have an issue number, check the GitHub Action status and preview URL from comments
    let actionStatus = null;
    let previewUrlFromComment = null;

    if (job.issueNumber) {
      // Check for Vercel preview URL in issue comments
      try {
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${process.env.GITHUB_REPO}/issues/${job.issueNumber}/comments`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (commentsResponse.ok) {
          const comments = await commentsResponse.json();
          // Look for the Vercel preview comment
          const vercelComment = comments.find((c: any) =>
            c.body?.includes("🚀 Vercel Preview Deployed") ||
            c.body?.includes("Vercel Preview Deployed")
          );

          if (vercelComment) {
            // Extract URL from the comment
            const urlMatch = vercelComment.body.match(/https:\/\/[^\s)]+\.vercel\.app/);
            if (urlMatch) {
              previewUrlFromComment = urlMatch[0];
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch issue comments:", error);
      }

      try {
        const response = await fetch(
          `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/runs?event=issues&per_page=10`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Find the workflow run for this issue
          const run = data.workflow_runs.find((r: any) => {
            // Check if the run was triggered by our issue
            return r.name === "Generate Site" &&
                   r.display_title?.includes(job.domain);
          });

          if (run) {
            actionStatus = {
              status: run.status, // queued, in_progress, completed
              conclusion: run.conclusion, // success, failure, null
              url: run.html_url,
              createdAt: run.created_at,
              updatedAt: run.updated_at,
            };

            // Fetch job details to get step-level progress
            if (run.status === "in_progress" || run.status === "completed") {
              const jobsResponse = await fetch(run.jobs_url, {
                headers: {
                  Authorization: `token ${process.env.GITHUB_TOKEN}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });

              if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                const firstJob = jobsData.jobs[0];

                if (firstJob) {
                  actionStatus.steps = firstJob.steps.map((step: any) => ({
                    name: step.name,
                    status: step.status,
                    conclusion: step.conclusion,
                  }));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch GitHub Action status:", error);
      }
    }

    return NextResponse.json({
      jobId: job.id,
      domain: job.domain,
      status: job.status,
      category: job.category,
      issueNumber: job.issueNumber,
      issueUrl: job.issueNumber
        ? `https://github.com/${process.env.GITHUB_REPO}/issues/${job.issueNumber}`
        : null,
      prUrl: job.prUrl,
      previewUrl: previewUrlFromComment || job.previewUrl, // Prioritize comment URL
      deploymentId: job.deploymentId,
      blueprintUrl: job.blueprintUrl,
      tokensUrl: job.tokensUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      actionStatus,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
