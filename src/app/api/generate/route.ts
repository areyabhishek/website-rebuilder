import { NextRequest, NextResponse } from "next/server";
import { extractDomain } from "@/lib/allowlist";
import { prisma } from "@/lib/prisma";
import { mapSite, crawlPages } from "@/lib/firecrawl";
import { generateBlueprint } from "@/lib/blueprint";
import { classifySite } from "@/lib/classifier";
import { writeArtifacts, createIssue } from "@/lib/github";
import { extractDesignSystem } from "@/lib/design-system";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      designUrl,
      contentUrl,
      url,
      limit = 8,
    }: {
      designUrl?: string;
      contentUrl?: string;
      url?: string;
      limit?: number;
    } = body;

    const designSource = designUrl ?? url;
    const contentSource = contentUrl ?? url;

    if (!designSource || !contentSource) {
      return NextResponse.json(
        {
          error:
            "Both designUrl and contentUrl are required. Provide a design source and a content source.",
        },
        { status: 400 },
      );
    }

    const designDomain = extractDomain(designSource);
    const contentDomain = extractDomain(contentSource);

    if (designDomain === contentDomain) {
      console.warn(
        `Design and content domains match (${designDomain}). Proceeding but resulting site may mirror original design.`,
      );
    }

    // Step 2: Create Job
    const job = await prisma.job.create({
      data: {
        domain: contentDomain,
        designDomain,
        status: "new",
      },
    });

    try {
      // Step 3: Crawl & extract design system
      const designMappedUrls = await mapSite(designSource);
      const designPages = await crawlPages(designMappedUrls, Math.min(limit, 6));
      const designSystem = await extractDesignSystem(designPages);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "design_ready",
          designLanguage: designSystem.designLanguage,
        },
      });

      // Step 4: Map content site
      const mappedUrls = await mapSite(contentSource);
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "mapped" },
      });

      // Step 5: Crawl content pages
      const crawledPages = await crawlPages(mappedUrls, limit);

      // Validate page count to prevent token limit issues
      if (crawledPages.length > 12) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "failed" },
        });
        return NextResponse.json(
          {
            error: "Site too large",
            message: `Content site has ${crawledPages.length} pages. Maximum allowed is 12 to keep design transfer high-quality. Try narrowing the URL to a smaller section.`,
          },
          { status: 400 },
        );
      }

      // Save content pages to database
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

      // Step 6: Generate content blueprint
      const blueprint = generateBlueprint(contentDomain, crawledPages);

      // Step 7: Classify content site for labeling
      const category = await classifySite(crawledPages);

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "blueprinted", category },
      });

      // Step 8: Write artifacts to GitHub
      const { blueprintUrl, tokensUrl, componentsUrl } = await writeArtifacts(
        job.id,
        blueprint,
        designSystem.tokens,
        {
          components: designSystem.components,
          designLanguage: designSystem.designLanguage,
          designDomain,
        },
      );

      // Step 9: Create GitHub issue
      const issueNumber = await createIssue(
        contentDomain,
        category,
        blueprintUrl,
        tokensUrl,
        componentsUrl,
        designSystem.designLanguage,
      );

      // Step 10: Update job with final status
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "issued",
          blueprintUrl,
          tokensUrl,
          componentsUrl,
          designLanguage: designSystem.designLanguage,
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
        componentsUrl,
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
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
