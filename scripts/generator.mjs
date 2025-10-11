#!/usr/bin/env node

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function fetchArtifact(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

async function getIssueArtifacts(issueNumber) {
  const response = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch issue: ${response.statusText}`);
  }

  const issue = await response.json();

  // Extract artifact URLs from issue body
  const blueprintMatch = issue.body.match(/\[Blueprint\]\(([^)]+)\)/);
  const tokensMatch = issue.body.match(/\[Theme Tokens\]\(([^)]+)\)/);

  if (!blueprintMatch || !tokensMatch) {
    throw new Error("Could not find artifact URLs in issue body");
  }

  // Convert GitHub URLs to raw content URLs
  const blueprintUrl = blueprintMatch[1].replace(
    "github.com",
    "raw.githubusercontent.com"
  ).replace("/blob/", "/");
  const tokensUrl = tokensMatch[1].replace(
    "github.com",
    "raw.githubusercontent.com"
  ).replace("/blob/", "/");

  const blueprint = await fetchArtifact(blueprintUrl);
  const tokens = await fetchArtifact(tokensUrl);

  return { blueprint, tokens };
}

function getCategoryFromLabels(labels) {
  const categories = [
    "portfolio",
    "blog",
    "saas-landing",
    "docs",
    "event",
    "restaurant",
  ];
  for (const label of labels) {
    if (categories.includes(label.name)) {
      return label.name;
    }
  }
  return "portfolio";
}

async function generateSite(siteType, blueprint, tokens) {
  const systemPrompt = `You are a code generator that creates Astro websites. Output ONLY valid JSON in this exact format:
{
  "files": [
    { "path": "...", "content": "..." }
  ],
  "readme": "..."
}

Requirements:
- Use Astro with TypeScript
- Build a navigation menu from blueprint.nav
- Follow theme tokens for colors, typography, spacing, radii, shadows, and component styles
- Match layout patterns to the site type (${siteType})
- Mobile-first CSS with good contrast (min 4.5:1)
- No dead links - only use hrefs from blueprint.nav
- Put images under /public
- Include proper meta tags for SEO`;

  const userPrompt = `Generate a complete Astro site.

siteType: ${siteType}

themeTokens:
${JSON.stringify(tokens, null, 2)}

blueprint:
${JSON.stringify(blueprint, null, 2)}

Requirements:
- Create all necessary pages from the blueprint
- Add a 404.astro page
- Add /sitemap.xml (if applicable)
- ${siteType === "blog" ? "Add /feed.xml for RSS" : ""}
- Return ONLY valid JSON with the format specified in the system prompt`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Try to parse JSON, retry once if it fails
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (error) {
    console.log("First attempt failed, waiting 2 minutes before retry to avoid rate limits...");

    // Wait 120 seconds to allow rate limit to reset
    await new Promise(resolve => setTimeout(resolve, 120000));

    const retryMessage = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
        {
          role: "assistant",
          content: responseText,
        },
        {
          role: "user",
          content:
            "That wasn't valid JSON. Return ONLY valid JSON with the exact format specified, nothing else.",
        },
      ],
    });

    const retryText =
      retryMessage.content[0].type === "text"
        ? retryMessage.content[0].text
        : "";
    result = JSON.parse(retryText);
  }

  return result;
}

function writeFiles(filesData, basePath = ".") {
  for (const file of filesData.files) {
    const filePath = join(basePath, file.path);
    const dir = dirname(filePath);

    // Create directory if it doesn't exist
    mkdirSync(dir, { recursive: true });

    // Write file
    writeFileSync(filePath, file.content, "utf-8");
    console.log(`Created: ${file.path}`);
  }
}

async function main() {
  const issueNumber = process.env.ISSUE_NUMBER;

  if (!issueNumber) {
    console.error("ISSUE_NUMBER environment variable is required");
    process.exit(1);
  }

  console.log(`Processing issue #${issueNumber}...`);

  // Fetch issue to get category
  const issueResponse = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const issue = await issueResponse.json();
  const siteType = getCategoryFromLabels(issue.labels);

  console.log(`Site type: ${siteType}`);

  // Fetch artifacts
  console.log("Fetching artifacts...");
  const { blueprint, tokens } = await getIssueArtifacts(issueNumber);

  // Generate site
  console.log("Generating site with Claude...");
  const result = await generateSite(siteType, blueprint, tokens);

  // Write files
  console.log("Writing files...");
  const outputDir = join(__dirname, "..", "generated-site");
  writeFiles(result, outputDir);

  // Write README
  const readmePath = join(outputDir, "README.md");
  writeFileSync(readmePath, result.readme, "utf-8");

  console.log("\n✓ Site generation complete!");
  console.log(`Output directory: ${outputDir}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
