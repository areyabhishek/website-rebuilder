import FirecrawlApp from "@mendable/firecrawl-js";
import type { FirecrawlPage } from "@/types";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

// Paths to exclude from crawling
const EXCLUDED_PATHS = [
  "/login",
  "/signin",
  "/signup",
  "/register",
  "/cart",
  "/checkout",
  "/search",
  "/404",
  "/admin",
  "/dashboard",
  "/account",
  "/settings",
];

function shouldExcludeUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return EXCLUDED_PATHS.some((excluded) =>
      pathname.toLowerCase().includes(excluded)
    );
  } catch {
    return true;
  }
}

export async function mapSite(url: string, limit = 500): Promise<string[]> {
  try {
    const response = await firecrawl.map(url, {
      limit,
    });

    console.log("Firecrawl map response links count:", response.links?.length || 0);

    if (!response.links || !Array.isArray(response.links)) {
      throw new Error(`Failed to map site: No links returned`);
    }

    if (response.links.length === 0) {
      throw new Error(`No pages found for ${url}. The site may be redirecting or unavailable.`);
    }

    // Extract URLs from link objects and filter out excluded URLs
    const urls = response.links
      .map((link: any) => link.url || link)
      .filter((linkUrl: string) => !shouldExcludeUrl(linkUrl))
      .slice(0, 60);

    console.log(`Found ${urls.length} valid URLs after filtering`);
    return urls;
  } catch (error) {
    console.error("Firecrawl map error:", error);
    throw new Error(`Firecrawl map failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function crawlPages(
  urls: string[],
  limit = 25
): Promise<FirecrawlPage[]> {
  // Use the first URL as the base, and let Firecrawl crawl from there
  const baseUrl = urls[0];

  console.log(`Starting crawl from: ${baseUrl} with limit: ${limit}`);

  const response = await firecrawl.crawl(baseUrl, {
    limit,
    scrapeOptions: {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
    },
  });

  console.log("Firecrawl crawl response:", {
    status: response.status,
    completed: response.completed,
    total: response.total,
    dataLength: response.data?.length || 0,
  });

  if (!response.data || !Array.isArray(response.data)) {
    throw new Error("Failed to crawl pages: No data returned");
  }

  if (response.data.length === 0) {
    throw new Error("Crawl completed but returned 0 pages");
  }

  return response.data.map((page: any) => ({
    url: page.metadata?.sourceURL || page.metadata?.url || page.url,
    title: page.metadata?.title,
    markdown: page.markdown,
    html: page.html,
    links: page.links,
  }));
}
