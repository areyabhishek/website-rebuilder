import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: "fc-76133e58b2eb4cd18440ce07e712bee8",
});

console.log("Testing healmygut.com with Firecrawl...\n");

// Test 1: Map the site
console.log("1. Mapping site structure...");
try {
  const mapResponse = await firecrawl.map("https://healmygut.com/", {
    limit: 500,
  });

  console.log("Map response:", JSON.stringify(mapResponse, null, 2).substring(0, 500));

  if (mapResponse.links) {
    console.log(`Found ${mapResponse.links.length} links`);
    console.log("First 10 links:");
    mapResponse.links.slice(0, 10).forEach((link, i) => {
      const url = typeof link === 'string' ? link : link.url;
      console.log(`  ${i + 1}. ${url}`);
    });
  }
} catch (error) {
  console.error("Map error:", error.message);
  console.error("Full error:", error);
}

// Test 2: Try crawling a few pages
console.log("\n2. Crawling pages...");
try {
  const crawlResponse = await firecrawl.crawl("https://healmygut.com/", {
    limit: 5,
    scrapeOptions: {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
    },
  });

  console.log("Crawl response status:", crawlResponse.status);
  console.log("Pages crawled:", crawlResponse.data?.length || 0);

  if (crawlResponse.data && crawlResponse.data.length > 0) {
    console.log("\nFirst page:");
    const firstPage = crawlResponse.data[0];
    console.log("  URL:", firstPage.metadata?.sourceURL || firstPage.url);
    console.log("  Title:", firstPage.metadata?.title);
    console.log("  Markdown length:", firstPage.markdown?.length || 0);
  }
} catch (error) {
  console.error("Crawl error:", error.message);
  console.error("Full error:", error);
}
