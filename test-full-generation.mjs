import { config } from 'dotenv';
config();

// Test the full generation flow
const testUrl = "https://healmygut.com";

console.log("🧪 Testing full generation flow for:", testUrl);
console.log("Environment variables:");
console.log("  FIRECRAWL_API_KEY:", process.env.FIRECRAWL_API_KEY ? "✓ Set" : "✗ Missing");
console.log("  ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "✓ Set" : "✗ Missing");
console.log("  GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "✓ Set" : "✗ Missing");
console.log("  GITHUB_REPO:", process.env.GITHUB_REPO || "✗ Missing");
console.log("  DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Missing");
console.log("");

// Import after env is loaded
const { mapSite, crawlPages } = await import('./src/lib/firecrawl.ts');
const { generateBlueprint } = await import('./src/lib/blueprint.ts');
const { classifySite } = await import('./src/lib/classifier.ts');

try {
  console.log("Step 1: Mapping site...");
  const mappedUrls = await mapSite(testUrl);
  console.log(`✓ Mapped ${mappedUrls.length} URLs`);
  console.log("  First 3:", mappedUrls.slice(0, 3));

  console.log("\nStep 2: Crawling pages...");
  const crawledPages = await crawlPages(mappedUrls, 25);
  console.log(`✓ Crawled ${crawledPages.length} pages`);
  console.log("  First page:", crawledPages[0]?.url, `(${crawledPages[0]?.markdown?.length || 0} chars)`);

  console.log("\nStep 3: Generating blueprint...");
  const blueprint = generateBlueprint("healmygut.com", crawledPages);
  console.log(`✓ Blueprint created with ${blueprint.pages?.length || 0} pages`);

  console.log("\nStep 4: Classifying site...");
  const category = await classifySite(crawledPages);
  console.log(`✓ Classified as: ${category}`);

  console.log("\n✅ SUCCESS! All steps completed without errors.");
  console.log("\nThis means the issue is specific to:");
  console.log("  1. How Next.js API routes are executing, OR");
  console.log("  2. How Vercel is building/deploying");

} catch (error) {
  console.error("\n❌ FAILED at some step:");
  console.error("Error:", error.message);
  console.error("\nStack:", error.stack);
  process.exit(1);
}
