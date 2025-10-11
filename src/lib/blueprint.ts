import type { Blueprint, FirecrawlPage } from "@/types";

function generateSlug(url: string): string {
  try {
    const { pathname } = new URL(url);
    if (pathname === "/" || pathname === "") return "index";

    return pathname
      .replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
      .replace(/\//g, "-") // Replace slashes with hyphens
      .replace(/[^a-z0-9-]/gi, "-") // Replace non-alphanumeric with hyphens
      .replace(/-+/g, "-") // Collapse multiple hyphens
      .toLowerCase();
  } catch {
    return "page";
  }
}

function extractSections(markdown: string = "") {
  const sections: Blueprint["pages"][0]["sections"] = [];
  const lines = markdown.split("\n");

  let currentSection: Record<string, string> | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // H1 - Hero section
    if (line.startsWith("# ")) {
      if (currentSection) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n").trim();
        }
        sections.push(currentSection);
        currentContent = [];
      }

      currentSection = {
        type: "hero",
        h1: line.replace(/^#\s+/, ""),
        sub: "",
        cta: "",
      };
    }
    // H2 - Section
    else if (line.startsWith("## ")) {
      if (currentSection) {
        if (currentContent.length > 0) {
          currentSection.content = currentContent.join("\n").trim();
        }
        sections.push(currentSection);
        currentContent = [];
      }

      currentSection = {
        type: "section",
        title: line.replace(/^##\s+/, ""),
      };
    } else if (line.trim()) {
      currentContent.push(line);
    }
  }

  // Push the last section
  if (currentSection) {
    if (currentContent.length > 0) {
      currentSection.content = currentContent.join("\n").trim();
    }
    sections.push(currentSection);
  }

  // If no sections found, create a default content block
  if (sections.length === 0) {
    sections.push({
      type: "content",
      content: markdown.slice(0, 1000), // First 1000 chars
    });
  }

  return sections;
}

function extractImages(html: string = ""): string[] {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images: string[] = [];
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }

  return images.slice(0, 10); // Max 10 images per page
}

function buildNavigation(pages: FirecrawlPage[]): Blueprint["nav"] {
  const linkCounts = new Map<string, number>();

  // Count link occurrences across all pages
  pages.forEach((page) => {
    page.links?.forEach((link) => {
      try {
        const url = new URL(link);
        const path = url.pathname;
        if (path && path !== "/") {
          linkCounts.set(path, (linkCounts.get(path) || 0) + 1);
        }
      } catch {
        // Invalid URL, skip
      }
    });
  });

  // Sort by count and take top 6
  const topPaths = Array.from(linkCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path]) => path);

  // Always include home
  const nav: Blueprint["nav"] = [{ text: "Home", href: "/" }];

  // Add top paths
  topPaths.forEach((path) => {
    const text = path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Page";

    nav.push({ text, href: path });
  });

  return nav.slice(0, 6); // Max 6 nav items
}

export function generateBlueprint(
  domain: string,
  pages: FirecrawlPage[]
): Blueprint {
  return {
    domain,
    nav: buildNavigation(pages),
    pages: pages.map((page) => ({
      url: page.url,
      slug: generateSlug(page.url),
      title: page.title || "Untitled",
      sections: extractSections(page.markdown),
      images: extractImages(page.html),
    })),
    assetsPolicy: {
      useOriginalImages: true,
      rewriteText: false, // Always use original content per requirements
    },
  };
}
