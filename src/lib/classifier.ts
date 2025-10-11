import Anthropic from "@anthropic-ai/sdk";
import type { SiteCategory, FirecrawlPage } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function classifyByRules(pages: FirecrawlPage[]): SiteCategory | null {
  const allText = pages
    .map((p) => `${p.url} ${p.title} ${p.markdown}`.toLowerCase())
    .join(" ");

  // Check for docs
  if (
    allText.includes("/docs") ||
    allText.includes("/api") ||
    allText.includes("/guide")
  ) {
    return "docs";
  }

  // Check for blog
  if (
    allText.includes("/blog") ||
    allText.includes("/posts") ||
    allText.includes("/articles")
  ) {
    return "blog";
  }

  // Check for SaaS landing
  if (
    allText.includes("pricing") &&
    (allText.includes("features") || allText.includes("signup"))
  ) {
    return "saas-landing";
  }

  // Check for event
  if (
    allText.includes("rsvp") ||
    allText.includes("schedule") ||
    (allText.includes("venue") && allText.includes("tickets"))
  ) {
    return "event";
  }

  // Check for restaurant
  if (
    (allText.includes("menu") && allText.includes("reservation")) ||
    allText.includes("chef") ||
    (allText.includes("hours") && allText.includes("reservation"))
  ) {
    return "restaurant";
  }

  return null;
}

async function classifyWithLLM(pages: FirecrawlPage[]): Promise<SiteCategory> {
  const sample = pages.slice(0, 3).map((p) => ({
    url: p.url,
    title: p.title,
    excerpt: p.markdown?.slice(0, 200), // Reduced from 500 to 200 chars
  }));

  const message = await anthropic.messages.create({
    model: "claude-haiku-3-20241022", // Much cheaper model
    max_tokens: 50, // Reduced from 200
    messages: [
      {
        role: "user",
        content: `Classify this website into ONE category: portfolio, blog, saas-landing, docs, event, or restaurant.

Sample pages:
${JSON.stringify(sample, null, 2)}

Respond with ONLY the category name, nothing else.`,
      },
    ],
  });

  const category = (
    message.content[0].type === "text" ? message.content[0].text : "portfolio"
  )
    .trim()
    .toLowerCase() as SiteCategory;

  const validCategories: SiteCategory[] = [
    "portfolio",
    "blog",
    "saas-landing",
    "docs",
    "event",
    "restaurant",
  ];

  return validCategories.includes(category) ? category : "portfolio";
}

export async function classifySite(
  pages: FirecrawlPage[]
): Promise<SiteCategory> {
  // Try rules first
  const rulesResult = classifyByRules(pages);
  if (rulesResult) {
    return rulesResult;
  }

  // Fallback to LLM
  return classifyWithLLM(pages);
}
