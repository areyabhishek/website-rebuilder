import FirecrawlApp from "@mendable/firecrawl-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const testDomain = "https://www.loveandlogic.com";

console.log(`Testing: ${testDomain}\n`);

try {
  console.log("1. Testing map()...");
  const mapResult = await firecrawl.map(testDomain, { limit: 10 });
  console.log("Map links found:", mapResult.links?.length || 0);
  if (mapResult.links && mapResult.links.length > 0) {
    console.log("First 3 links:", mapResult.links.slice(0, 3));
  }
} catch (error) {
  console.error("Map error:", error.message);
}

try {
  console.log("\n2. Testing crawl()...");
  const crawlResult = await firecrawl.crawl(testDomain, { limit: 2 });
  console.log("Crawl status:", crawlResult.status);
  console.log("Pages crawled:", crawlResult.data?.length || 0);
} catch (error) {
  console.error("Crawl error:", error.message);
}
