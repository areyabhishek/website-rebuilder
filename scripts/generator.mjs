#!/usr/bin/env node

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load prompt configuration
const configPath = join(__dirname, "..", "config", "generator-prompt.json");
const promptConfig = JSON.parse(readFileSync(configPath, "utf-8"));

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

  const tokensMatch = issue.body.match(/\[Theme Tokens\]\(([^)]+)\)/);
  if (!tokensMatch) {
    throw new Error("Could not find theme tokens URL in issue body");
  }

  const tokensUrl = tokensMatch[1]
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");

  const tokens = await fetchArtifact(tokensUrl);

  const componentsMatch = issue.body.match(/\[Component Library\]\(([^)]+)\)/);
  let components = null;
  if (componentsMatch) {
    const componentsUrl = componentsMatch[1]
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");

    try {
      components = await fetchArtifact(componentsUrl);
    } catch (error) {
      console.warn("Failed to fetch components artifact:", error.message);
    }
  }

  const designLanguageMatch = issue.body.match(/Design language:\s*(.+)/i);
  const designLanguage = designLanguageMatch
    ? designLanguageMatch[1].trim()
    : "Design system derived from source";

  return {
    blueprint,
    tokens,
    components,
    designLanguage,
  };
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

async function generateSite({
  siteType,
  blueprint,
  tokens,
  components,
  designLanguage,
}) {
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

  const designTokensSummary = JSON.stringify(tokens, null, 2);
  const componentGuideSummary =
    components && Array.isArray(components.components)
      ? JSON.stringify(components.components, null, 2)
      : JSON.stringify(
          [
            {
              name: "Hero",
              purpose: "page-intro",
              description:
                "Create a dramatic first impression using the primary brand color and layered backgrounds.",
            },
          ],
          null,
          2,
        );

  const designLanguageSummary =
    (components && components.designLanguage) || designLanguage || "";

  // Use prompts from config file with variable substitution
  const systemPrompt = promptConfig.systemPrompt
    .replaceAll("{{siteType}}", siteType)
    .replaceAll("{{designLanguage}}", designLanguageSummary || siteType);

  const userPrompt = promptConfig.userPromptTemplate
    .replaceAll("{{domain}}", domain)
    .replaceAll("{{siteType}}", siteType)
    .replaceAll("{{navigation}}", navigation)
    .replaceAll("{{contentSummary}}", contentSummary)
    .replaceAll("{{designTokens}}", designTokensSummary)
    .replaceAll("{{componentGuide}}", componentGuideSummary)
    .replaceAll("{{designLanguage}}", designLanguageSummary || siteType);

  console.log(`Sending request to ${promptConfig.model}...`);

  const message = await anthropic.messages.create({
    model: promptConfig.model,
    max_tokens: promptConfig.maxTokens,
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

  // Check if response was truncated
  const stopReason = message.stop_reason;
  if (stopReason === "max_tokens") {
    console.warn("⚠️  Response was truncated due to max_tokens limit!");
    console.warn("The JSON may be incomplete. Attempting to parse anyway...");
  }

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
    console.log("\nResponse end:");
    console.log(responseText.substring(responseText.length - 200));

    // Check if truncated
    if (stopReason === "max_tokens") {
      throw new Error(
        `Response was truncated at max_tokens limit. The JSON is incomplete.\n` +
        `This usually means the generated site was too large.\n` +
        `Try: 1) Reduce the number of pages to crawl, or 2) Increase maxTokens in config.\n` +
        `Parse error: ${error.message}`
      );
    }

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

async function deployToVercel(dirPath, projectName) {
  if (!process.env.VERCEL_TOKEN) {
    console.warn("VERCEL_TOKEN not set, skipping Vercel deployment");
    return null;
  }

  console.log(`Deploying to Vercel as project: ${projectName}...`);

  // Read all files from the directory
  const { readdirSync, statSync, readFileSync: readFileSyncLocal } = await import("fs");

  function getAllFiles(dir, fileList = []) {
    const files = readdirSync(dir);
    files.forEach((file) => {
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        getAllFiles(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    return fileList;
  }

  const allFiles = getAllFiles(dirPath);
  const vercelFiles = allFiles.map((filePath) => {
    const relativePath = filePath.replace(dirPath + "/", "");
    const content = readFileSyncLocal(filePath, "utf-8");
    return {
      file: relativePath,
      data: content,
    };
  });

  console.log(`Deploying ${vercelFiles.length} files...`);

  // Deploy to Vercel
  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      files: vercelFiles,
      projectSettings: {
        framework: "astro",
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm install",
      },
      target: "production",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Vercel deployment failed: ${response.statusText}\n${error}`);
    return null;
  }

  const deployment = await response.json();
  const previewUrl = `https://${deployment.url}`;

  console.log(`✓ Deployed to Vercel: ${previewUrl}`);

  return {
    url: previewUrl,
    id: deployment.id,
  };
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

  // Skip docs sites - they're too complex and hit token limits
  if (siteType === "docs") {
    console.log("⚠️  Skipping docs site - these are too complex for the current token limits");
    console.log("Docs sites typically have many pages and hit the maxTokens limit.");
    console.log("Consider increasing maxTokens in config/generator-prompt.json for docs sites.");

    // Close the issue with a comment explaining why
    await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: `## ⚠️ Documentation Site Skipped

This site was detected as a **documentation site** and has been skipped due to complexity constraints.

**Why?**
Documentation sites typically have many pages (8+), which causes the AI response to exceed token limits and results in incomplete JSON output.

**Solutions:**
1. **Reduce page count**: Manually edit the blueprint to include fewer pages
2. **Increase token limit**: Update \`maxTokens\` in \`config/generator-prompt.json\` from 16000 to 24000
3. **Use a different site type**: Re-label this issue with a different category (portfolio, blog, saas-landing, etc.)

For now, this issue will be closed. Feel free to re-open with adjustments!`,
        }),
      }
    );

    // Close the issue
    await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: "closed",
          labels: ["generate-site", "docs", "skipped"],
        }),
      }
    );

    console.log("✓ Issue closed with explanation comment");
    process.exit(0);
  }

  // Fetch artifacts
  console.log("Fetching artifacts...");
  const { blueprint, tokens, components, designLanguage } =
    await getIssueArtifacts(issueNumber);

  console.log(
    `Blueprint loaded: ${blueprint.domain} with ${blueprint.pages.length} pages`,
  );

  // Generate site
  console.log("Generating site with Claude Sonnet 4.5...");
  const result = await generateSite({
    siteType,
    blueprint,
    tokens,
    components,
    designLanguage,
  });

  // Write files
  console.log("Writing files...");
  const outputDir = join(__dirname, "..", "generated-site");
  writeFiles(result, outputDir);

  console.log("\n✓ Site generation complete!");
  console.log(`Output directory: ${outputDir}`);

  // Deploy to Vercel if token is available
  const deployment = await deployToVercel(outputDir, `gen-site-${issueNumber}`);

  if (deployment) {
    // Write deployment info to a file that GitHub Actions can read
    const deploymentInfo = {
      previewUrl: deployment.url,
      deploymentId: deployment.id,
      issueNumber,
    };
    writeFileSync(
      join(__dirname, "..", "deployment-info.json"),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`\n✓ Deployment info saved for GitHub Actions`);
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
