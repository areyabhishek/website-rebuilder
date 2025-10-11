import { NextRequest, NextResponse } from "next/server";
import { extractDomain } from "@/lib/allowlist";
import { prisma } from "@/lib/prisma";
import { mapSite, crawlPages } from "@/lib/firecrawl";
import { generateBlueprint } from "@/lib/blueprint";
import { classifySite } from "@/lib/classifier";
import { generateTokens } from "@/lib/theme-packs";
import { writeArtifacts, createIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, limit = 25 } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Allowlist check removed - crawl any site
    const domain = extractDomain(url);

    // Step 2: Create Job
    const job = await prisma.job.create({
      data: {
        domain,
        status: "new",
      },
    });

    try {
      // Step 3: Map site
      const mappedUrls = await mapSite(url);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "mapped" },
      });

    // Step 4: Crawl pages
    const crawledPages = await crawlPages(mappedUrls, limit);

    // Validate page count to prevent token limit issues
    if (crawledPages.length > 20) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { 
          error: "Site too large", 
          message: `Site has ${crawledPages.length} pages, maximum allowed is 20 to prevent token limit issues. Please try a smaller site.` 
        }, 
        { status: 400 }
      );
    }

    // Save pages to database
      await Promise.all(
        crawledPages.map((page) =>
          prisma.page.create({
            data: {
              jobId: job.id,
              url: page.url,
              title: page.title,
              md: page.markdown,
              html: page.html,
            },
          })
        )
      );

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "crawled" },
      });

      // Step 5: Generate blueprint
      const blueprint = generateBlueprint(domain, crawledPages);

      // Step 6: Classify site
      const category = await classifySite(crawledPages);

      // Step 7: Generate tokens
      const tokens = generateTokens(category);

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "blueprinted", category },
      });

      // Step 8: Write artifacts to GitHub
      const { blueprintUrl, tokensUrl } = await writeArtifacts(
        job.id,
        blueprint,
        tokens
      );

      // Step 9: Create GitHub issue
      const issueNumber = await createIssue(
        domain,
        category,
        blueprintUrl,
        tokensUrl
      );

      // Step 10: Update job with final status
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "issued",
          blueprintUrl,
          tokensUrl,
          issueNumber,
        },
      });

      return NextResponse.json({
        success: true,
        jobId: updatedJob.id,
        issueNumber,
        issueUrl: `https://github.com/${process.env.GITHUB_REPO}/issues/${issueNumber}`,
        blueprintUrl,
        tokensUrl,
      });
    } catch (error) {
      // Update job status to failed
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "failed" },
      });

      throw error;
    }
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate site",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
