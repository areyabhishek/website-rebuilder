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

// File extensions and patterns to exclude
const EXCLUDED_PATTERNS = [
  ".xml",   // Sitemaps
  ".pdf",   // PDFs
  ".zip",   // Archives
  ".jpg",   // Images
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  "/feed",  // RSS feeds
  "/wp-json", // WordPress API
  "/wp-content", // WordPress assets
  "/wp-includes", // WordPress core files
];

function shouldExcludeUrl(url: string): boolean {
  try {
    const urlLower = url.toLowerCase();

    // Check if URL contains excluded file extensions or patterns
    if (EXCLUDED_PATTERNS.some((pattern) => urlLower.includes(pattern))) {
      return true;
    }

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
      .map((link: unknown): string => {
        if (typeof link === 'string') return link;
        if (typeof link === 'object' && link !== null && 'url' in link) {
          return (link as { url?: string }).url || '';
        }
        return '';
      })
      .filter((linkUrl: string) => linkUrl && !shouldExcludeUrl(linkUrl))
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
  console.log(`crawlPages called with ${urls.length} URLs`);
  console.log(`First 5 URLs:`, urls.slice(0, 5));

  // Extract the base domain from the first URL and use the homepage
  const firstUrl = urls[0];
  const parsedUrl = new URL(firstUrl);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  console.log(`Starting crawl from: ${baseUrl} (extracted from ${firstUrl}) with limit: ${limit}`);

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
    console.error("Firecrawl returned no data array");
    throw new Error("Failed to crawl pages: No data returned");
  }

  if (response.data.length === 0) {
    console.error(`Crawl from ${baseUrl} returned 0 pages. This usually means:`);
    console.error("1. The site blocks crawlers");
    console.error("2. Firecrawl couldn't access the site");
    console.error("3. All pages were excluded by robots.txt");
    throw new Error(`Crawl completed but returned 0 pages from ${baseUrl}. The site may block crawlers or require authentication.`);
  }

  console.log(`Successfully crawled ${response.data.length} pages from ${baseUrl}`);

  interface FirecrawlPageResponse {
    url?: string;
    metadata?: {
      sourceURL?: string;
      url?: string;
      title?: string;
    };
    markdown?: string;
    html?: string;
    links?: string[];
  }

  // Filter out unwanted URLs from crawl results
  const filteredData = response.data.filter((page: FirecrawlPageResponse) => {
    const pageUrl = page.metadata?.sourceURL || page.metadata?.url || page.url || '';
    const shouldExclude = shouldExcludeUrl(pageUrl);
    if (shouldExclude) {
      console.log(`Excluding: ${pageUrl}`);
    }
    return !shouldExclude;
  });

  console.log(`Filtered crawl results: ${response.data.length} -> ${filteredData.length} pages`);

  if (filteredData.length === 0) {
    console.error("All pages were filtered out. Original URLs:", response.data.map((p: FirecrawlPageResponse) => p.metadata?.sourceURL || p.url));
    throw new Error("All crawled pages were filtered out (XML sitemaps, assets, etc.). Try a different URL.");
  }

  return filteredData.map((page: FirecrawlPageResponse) => ({
    url: page.metadata?.sourceURL || page.metadata?.url || page.url || '',
    title: page.metadata?.title,
    markdown: page.markdown,
    html: page.html,
    links: page.links,
  }));
}
