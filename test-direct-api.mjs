// Test the API functions directly without HTTP server
import { config } from 'dotenv';
config();

// Import the functions we need to test
import { mapSite, crawlPages } from './src/lib/firecrawl.ts';

const url = "https://healmygut.com";

console.log("Testing healmygut.com generation directly...\n");

try {
  console.log("1. Mapping site...");
  const mappedUrls = await mapSite(url);
  console.log(`✅ Found ${mappedUrls.length} URLs`);
  console.log("First 5 URLs:", mappedUrls.slice(0, 5));

  console.log("\n2. Crawling pages...");
  const crawledPages = await crawlPages(mappedUrls, 25);
  console.log(`✅ Crawled ${crawledPages.length} pages`);

  if (crawledPages.length > 0) {
    console.log("\nFirst page:");
    console.log("  URL:", crawledPages[0].url);
    console.log("  Title:", crawledPages[0].title);
    console.log("  Markdown length:", crawledPages[0].markdown?.length || 0);
  }

  console.log("\n✅ Generation test successful!");
} catch (error) {
  console.error("\n❌ Generation failed!");
  console.error("Error:", error.message);
  console.error("\nStack:", error.stack);
  process.exit(1);
}
