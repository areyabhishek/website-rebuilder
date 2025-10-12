import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: "fc-76133e58b2eb4cd18440ce07e712bee8",
});

console.log("Testing healmygut.com crawl directly...\n");

const baseUrl = "https://healmygut.com";

try {
  console.log(`Crawling from: ${baseUrl}`);

  const response = await firecrawl.crawl(baseUrl, {
    limit: 25,
    scrapeOptions: {
      formats: ["markdown", "html", "links"],
      onlyMainContent: true,
    },
  });

  console.log("\n=== CRAWL RESPONSE ===");
  console.log("Status:", response.status);
  console.log("Completed:", response.completed);
  console.log("Total:", response.total);
  console.log("Data length:", response.data?.length || 0);

  if (response.data && response.data.length > 0) {
    console.log("\n=== FIRST 3 PAGES ===");
    response.data.slice(0, 3).forEach((page, i) => {
      console.log(`\n${i + 1}. ${page.metadata?.title || "No title"}`);
      console.log(`   URL: ${page.metadata?.sourceURL || page.url}`);
      console.log(`   Markdown length: ${page.markdown?.length || 0}`);
    });
  } else {
    console.log("\n❌ NO PAGES RETURNED");
    console.log("Full response:", JSON.stringify(response, null, 2));
  }
} catch (error) {
  console.error("\n❌ CRAWL ERROR:");
  console.error(error.message);
  console.error("\nFull error:", error);
}
