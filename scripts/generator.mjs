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

  // Extract blueprint URL from issue body
  const blueprintMatch = issue.body.match(/\[Blueprint\]\(([^)]+)\)/);

  if (!blueprintMatch) {
    throw new Error("Could not find blueprint URL in issue body");
  }

  // Convert GitHub URL to raw content URL
  const blueprintUrl = blueprintMatch[1]
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");

  const blueprint = await fetchArtifact(blueprintUrl);

  return { blueprint };
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

async function generateSite(siteType, blueprint) {
  // Extract content from blueprint
  const domain = blueprint.domain;
  const pages = blueprint.pages.map((page) => ({
    title: page.title,
    slug: page.slug,
    sections: page.sections,
    images: page.images,
  }));

  const navigation = blueprint.nav
    .map((n) => `${n.text}: ${n.href}`)
    .join(", ");

  // Build a content summary
  const contentSummary = pages
    .slice(0, 5) // Limit to first 5 pages
    .map((page) => {
      const sectionsText = page.sections
        .map((s) => {
          const parts = [];
          if (s.h1) parts.push(`Heading: ${s.h1}`);
          if (s.sub) parts.push(`Subtext: ${s.sub}`);
          if (s.title) parts.push(`Title: ${s.title}`);
          if (s.content) parts.push(`Content: ${s.content.substring(0, 200)}`);
          if (s.cta) parts.push(`CTA: ${s.cta}`);
          return parts.join(" | ");
        })
        .join("\n  ");

      return `Page: ${page.title} (${page.slug})
  ${sectionsText}
  Images: ${page.images.length} image(s)`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert web designer and developer. Create a beautiful, modern Astro website based on the content provided.

IMPORTANT: You MUST respond with ONLY valid JSON in this EXACT format (no markdown, no code blocks, no explanation):
{
  "files": [
    {"path": "src/pages/index.astro", "content": "..."},
    {"path": "src/pages/about.astro", "content": "..."}
  ]
}

Design guidelines:
- Modern, clean, beautiful design with excellent typography
- Mobile-first responsive design
- Use inline <style> tags with modern CSS (NO external CSS, NO Tailwind CDN)
- Use CSS Grid, Flexbox, and modern CSS features
- Match the site type: ${siteType}
- Use the original navigation structure
- Professional color scheme with good contrast
- Smooth animations and hover effects with CSS transitions
- Include proper meta tags and SEO`;

  const userPrompt = `Create a complete Astro website for: ${domain}

Site Type: ${siteType}

Navigation: ${navigation}

Content from original site:
${contentSummary}

Requirements:
1. Create ONLY 3 pages maximum: index.astro, about.astro (or similar), and 404.astro
2. Use inline <style> tags in each page with modern CSS (NO Tailwind, NO external CSS files)
3. Keep each page under 200 lines of code
4. Use simple, clean layouts with CSS Grid and Flexbox
5. Make it mobile-responsive with @media queries
6. Use placeholder images from https://images.unsplash.com/
7. Include package.json and astro.config.mjs
8. Return ONLY the JSON with files array - no markdown formatting, no code blocks

IMPORTANT:
- NO Tailwind CDN scripts
- Use <style> tags with regular CSS
- Keep the response under 15000 tokens by creating simple, concise pages.`;

  console.log("Sending request to Claude Sonnet 4.5...");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16000, // Increased from 8000 for complete sites
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  let responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  console.log("Response received, parsing...");

  // Clean up response - remove markdown code blocks if present
  responseText = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try to parse JSON
  let result;
  try {
    result = JSON.parse(responseText);
    console.log(`Successfully parsed! Generated ${result.files?.length || 0} files.`);
  } catch (error) {
    console.log("JSON parsing failed. Response preview:");
    console.log(responseText.substring(0, 500));
    throw new Error(
      `Failed to parse JSON response: ${error.message}\nResponse: ${responseText.substring(0, 200)}...`
    );
  }

  return result;
}

function writeFiles(filesData, basePath = ".") {
  if (!filesData.files || !Array.isArray(filesData.files)) {
    throw new Error("Invalid files data structure");
  }

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

  // Fetch blueprint
  console.log("Fetching blueprint...");
  const { blueprint } = await getIssueArtifacts(issueNumber);

  console.log(`Blueprint loaded: ${blueprint.domain} with ${blueprint.pages.length} pages`);

  // Generate site
  console.log("Generating site with Claude Sonnet 4.5...");
  const result = await generateSite(siteType, blueprint);

  // Write files
  console.log("Writing files...");
  const outputDir = join(__dirname, "..", "generated-site");
  writeFiles(result, outputDir);

  console.log("\n✓ Site generation complete!");
  console.log(`Output directory: ${outputDir}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
