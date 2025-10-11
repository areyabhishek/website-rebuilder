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
  const response = await firecrawl.map(url, {
    limit,
  });

  if (!response.success || !response.links) {
    throw new Error("Failed to map site");
  }

  // Filter out excluded URLs and return up to 60 internal URLs
  const filtered = response.links
    .filter((link) => !shouldExcludeUrl(link))
    .slice(0, 60);

  return filtered;
}

export async function crawlPages(
  urls: string[],
  limit = 25
): Promise<FirecrawlPage[]> {
  const urlsToProcess = urls.slice(0, limit);

  const response = await firecrawl.crawl(urlsToProcess[0], {
    limit,
    includePaths: urlsToProcess,
    scrapeOptions: {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
    },
  });

  if (!response.success || !response.data) {
    throw new Error("Failed to crawl pages");
  }

  return response.data.map((page: any) => ({
    url: page.metadata?.url || page.url,
    title: page.metadata?.title,
    markdown: page.markdown,
    html: page.html,
    links: page.links,
  }));
}
