import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: "fc-76133e58b2eb4cd18440ce07e712bee8",
});

const EXCLUDED_PATTERNS = [
  ".xml",
  ".pdf",
  ".zip",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".webp",
  "/feed",
  "/wp-json",
  "/wp-content",
  "/wp-includes",
];

function shouldExcludeUrl(url) {
  const urlLower = url.toLowerCase();
  return EXCLUDED_PATTERNS.some((pattern) => urlLower.includes(pattern));
}

console.log("Testing healmygut.com with improved filtering...\n");

try {
  const mapResponse = await firecrawl.map("https://healmygut.com/", {
    limit: 500,
  });

  console.log(`Total links found: ${mapResponse.links.length}`);

  const filteredLinks = mapResponse.links
    .map((link) => (typeof link === "string" ? link : link.url))
    .filter((url) => url && !shouldExcludeUrl(url));

  console.log(`Links after filtering: ${filteredLinks.length}\n`);
  console.log("Filtered links:");
  filteredLinks.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });
} catch (error) {
  console.error("Error:", error.message);
}
