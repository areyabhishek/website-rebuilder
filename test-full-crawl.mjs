import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: "fc-76133e58b2eb4cd18440ce07e712bee8",
});

console.log("Testing full crawl of healmygut.com...\n");

try {
  console.log("Starting crawl with limit 25...");
  const crawlResponse = await firecrawl.crawl("https://healmygut.com/", {
    limit: 25,
    scrapeOptions: {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
    },
  });

  console.log("Crawl status:", crawlResponse.status);
  console.log("Total pages:", crawlResponse.total);
  console.log("Completed pages:", crawlResponse.completed);
  console.log("Data length:", crawlResponse.data?.length || 0);

  if (crawlResponse.data && crawlResponse.data.length > 0) {
    console.log("\n✅ Crawl successful!");
    console.log("\nFirst 5 pages:");
    crawlResponse.data.slice(0, 5).forEach((page, i) => {
      const url = page.metadata?.sourceURL || page.metadata?.url || page.url;
      const title = page.metadata?.title || "No title";
      const mdLength = page.markdown?.length || 0;
      console.log(`  ${i + 1}. ${title}`);
      console.log(`     URL: ${url}`);
      console.log(`     Markdown: ${mdLength} chars`);
    });
  } else {
    console.error("\n❌ Crawl returned 0 pages!");
  }
} catch (error) {
  console.error("\n❌ Crawl failed!");
  console.error("Error:", error.message);
  console.error("Full error:", error);
}
