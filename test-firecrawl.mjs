import FirecrawlApp from "@mendable/firecrawl-js";
import dotenv from "dotenv";

dotenv.config();

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

console.log("Testing Firecrawl API...");
console.log("API Key:", process.env.FIRECRAWL_API_KEY ? "Set" : "Not set");

// Check structure
console.log("\n1. Firecrawl structure:");
console.log("firecrawl.v1:", typeof firecrawl.v1);
if (firecrawl.v1) {
  console.log("v1 methods:", Object.keys(firecrawl.v1));
}

// Test map function
try {
  console.log("\n2. Testing map() function (direct)...");
  const mapResult = await firecrawl.map("https://icyproductions.com", {
    limit: 10,
  });
  console.log("Map result:", JSON.stringify(mapResult, null, 2));
} catch (error) {
  console.error("Map error:", error.message);
}

// Try with async/wait pattern
try {
  console.log("\n3. Testing crawl() function...");
  const crawlResult = await firecrawl.crawl("https://icyproductions.com", {
    limit: 3,
  });
  console.log("Crawl result:", JSON.stringify(crawlResult, null, 2));
} catch (error) {
  console.error("Crawl error:", error.message);
}
