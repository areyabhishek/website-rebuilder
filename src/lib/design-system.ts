import Anthropic from "@anthropic-ai/sdk";
import type {
  DesignComponentSpec,
  DesignSystemArtifacts,
  FirecrawlPage,
  ThemeTokens,
} from "@/types";

type DesignHints = {
  colors: string[];
  fonts: string[];
  radii: number[];
  spacings: number[];
  htmlSamples: string[];
  textSamples: string[];
};

const anthropicClient =
  process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== ""
    ? new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    : null;

function uniquePreserveOrder<T>(values: T[]): T[] {
  const seen = new Set<T>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function normalizeColor(value: string): string | null {
  const hexMatch = value.match(
    /#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?/,
  );
  if (hexMatch) {
    const normalized = hexMatch[0].toLowerCase();
    if (normalized.length === 4) {
      return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    }
    return normalized;
  }

  const rgbMatch = value.match(/rgba?\([^)]+\)/);
  if (rgbMatch) {
    return rgbMatch[0];
  }

  return null;
}

function parseNumberFromCss(value: string): number | null {
  const numberMatch = value.match(/-?\d+(\.\d+)?/);
  if (!numberMatch) return null;
  const parsed = Number.parseFloat(numberMatch[0]);
  return Number.isFinite(parsed) ? Number.parseFloat(parsed.toFixed(2)) : null;
}

function extractDesignHints(pages: FirecrawlPage[]): DesignHints {
  const aggregatedHtml: string[] = [];
  const aggregatedText: string[] = [];

  const colorMatches: string[] = [];
  const fontMatches: string[] = [];
  const radiiMatches: number[] = [];
  const spacingMatches: number[] = [];

  pages.forEach((page) => {
    if (page.html) {
      aggregatedHtml.push(page.html);
      const styleBlocks = page.html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleBlocks) {
        styleBlocks.forEach((block) => {
          const inside = block.replace(/<style[^>]*>|<\/style>/gi, " ");
          inside
            .match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g)
            ?.forEach((match) => {
              const normalized = normalizeColor(match);
              if (normalized) colorMatches.push(normalized);
            });

          inside
            .match(/font-family\s*:\s*[^;]+/gi)
            ?.forEach((match) => fontMatches.push(match));

          inside
            .match(/border-radius\s*:\s*[^;]+/gi)
            ?.forEach((match) => {
              const radius = parseNumberFromCss(match);
              if (radius !== null) radiiMatches.push(radius);
            });

          inside
            .match(/(padding|margin|gap)\s*:\s*[^;]+/gi)
            ?.forEach((match) => {
              const spacing = parseNumberFromCss(match);
              if (spacing !== null) spacingMatches.push(spacing);
            });
        });
      }

      const inlineStyles = page.html.match(/style="[^"]+"/gi);
      if (inlineStyles) {
        inlineStyles.forEach((styleAttr) => {
          styleAttr
            .match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)/g)
            ?.forEach((match) => {
              const normalized = normalizeColor(match);
              if (normalized) colorMatches.push(normalized);
            });

          styleAttr
            .match(/font-family\s*:\s*[^;"]+/gi)
            ?.forEach((match) => fontMatches.push(match));

          styleAttr
            .match(/border-radius\s*:\s*[^;"]+/gi)
            ?.forEach((match) => {
              const radius = parseNumberFromCss(match);
              if (radius !== null) radiiMatches.push(radius);
            });

          styleAttr
            .match(/(padding|margin|gap)\s*:\s*[^;"]+/gi)
            ?.forEach((match) => {
              const spacing = parseNumberFromCss(match);
              if (spacing !== null) spacingMatches.push(spacing);
            });
        });
      }
    }

    if (page.markdown) {
      aggregatedText.push(page.markdown);
    }
  });

  const colors = uniquePreserveOrder(colorMatches).slice(0, 12);

  const fonts = uniquePreserveOrder(
    fontMatches
      .map((declaration) => {
        const [, familyRaw] = declaration.split(":");
        return familyRaw
          ? familyRaw
              .replace(/["';]/g, " ")
              .split(",")
              .map((value) => value.trim())
              .filter((value) => value && value !== "sans-serif")
          : [];
      })
      .flat(),
  ).slice(0, 6);

  const radii = uniquePreserveOrder(radiiMatches)
    .sort((a, b) => a - b)
    .slice(0, 5);

  const spacings = uniquePreserveOrder(spacingMatches)
    .sort((a, b) => a - b)
    .slice(0, 8);

  const htmlSamples = aggregatedHtml
    .map((html) =>
      html
        .replace(/\s+/g, " ")
        .replace(/<!--.*?-->/g, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 3)
    .map((snippet) => snippet.slice(0, 8000));

  const textSamples = aggregatedText
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5);

  return { colors, fonts, radii, spacings, htmlSamples, textSamples };
}

function buildFallbackTokens(hints: DesignHints): ThemeTokens {
  const [brand = "#3b82f6", brandAlt = "#8b5cf6", bg = "#0f172a"] =
    hints.colors;

  const fontPrimary = hints.fonts[0] || "Inter";
  const fontSecondary = hints.fonts[1] || fontPrimary;

  const radii =
    hints.radii.length > 0
      ? {
          sm: hints.radii[0] ?? 8,
          md: hints.radii[Math.min(1, hints.radii.length - 1)] ?? 16,
          lg: hints.radii[Math.min(2, hints.radii.length - 1)] ?? 24,
        }
      : { sm: 8, md: 16, lg: 24 };

  const spacingScale =
    hints.spacings.length > 0
      ? [0, ...hints.spacings.slice(0, 9)]
      : [0, 4, 8, 12, 16, 24, 32, 48, 64, 96];

  const isDarkBackground =
    bg.startsWith("#") &&
    bg.length >= 4 &&
    parseInt(bg.replace("#", "").slice(0, 2), 16) < 140;

  return {
    name: "custom-derived",
    fonts: {
      heading: fontPrimary,
      body: fontSecondary,
    },
    color: {
      brand,
      brandAlt,
      bg,
      surface: isDarkBackground ? "#111929" : "#f8fafc",
      text: isDarkBackground ? "#f1f5f9" : "#1f2937",
      muted: isDarkBackground ? "#94a3b8" : "#6b7280",
    },
    radii,
    shadow: {
      sm: "0 4px 12px rgba(15, 23, 42, 0.14)",
      md: "0 24px 60px rgba(15, 23, 42, 0.28)",
    },
    space: spacingScale,
    components: {
      button: "elevated",
      card: "layered",
      menu: "sticky",
    },
  };
}

function buildFallbackComponents(pages: FirecrawlPage[]): DesignComponentSpec[] {
  const components: DesignComponentSpec[] = [];
  const seen = new Set<string>();

  pages.forEach((page) => {
    const headings =
      page.markdown?.match(/^#+\s+.+$/gm)?.map((heading) => heading.trim()) ||
      [];

    headings.forEach((heading) => {
      const title = heading.replace(/^#+\s*/, "");
      if (!seen.has(title.toLowerCase())) {
        seen.add(title.toLowerCase());
        components.push({
          name: title,
          purpose: "content-section",
          description:
            "Section detected in source content. Use to lay out related copy with cohesive spacing.",
          keyStyles: ["match typography scale", "balance whitespace"],
          usageNotes: ["Maintain hierarchy", "Use consistent spacing tokens"],
        });
      }
    });
  });

  if (components.length === 0) {
    components.push(
      {
        name: "Hero",
        purpose: "page-intro",
        description:
          "Large welcoming section with precise typography scale and generous padding.",
        keyStyles: [
          "Full-width background layer",
          "Bold primary headline",
          "Prominent call-to-action buttons",
        ],
        usageNotes: [
          "Keep primary action emphasized with brand color",
          "Limit hero copy to 2–3 short sentences",
        ],
      },
      {
        name: "Feature Grid",
        purpose: "feature-highlights",
        description:
          "Card-based grid for showcasing differentiators with iconography.",
        keyStyles: ["3 or 4-column layout", "Soft shadows", "Rounded corners"],
        usageNotes: [
          "Ensure iconography aligns to a consistent size",
          "Use space tokens to maintain consistent gaps",
        ],
      },
    );
  }

  return components.slice(0, 8);
}

type MessageTextChunk = { type: string; text?: string };

function sanitizeModelText(content: MessageTextChunk[]): string {
  const textChunk = content.find((chunk) => chunk.type === "text");
  if (!textChunk || textChunk.type !== "text") {
    return "";
  }

  return textChunk.text.replace(/```json\s*|```\s*/g, "").trim();
}

function validateDesignSystemCandidate(
  candidate: unknown,
): DesignSystemArtifacts | null {
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !("tokens" in candidate) ||
    !("components" in candidate)
  ) {
    return null;
  }

  const { tokens, components, designLanguage = "custom" } =
    candidate as DesignSystemArtifacts;

  if (
    !tokens ||
    typeof tokens !== "object" ||
    !("color" in tokens) ||
    !("fonts" in tokens)
  ) {
    return null;
  }

  if (!Array.isArray(components)) {
    return null;
  }

  return {
    tokens: tokens as ThemeTokens,
    components: components as DesignComponentSpec[],
    designLanguage,
  };
}

export async function extractDesignSystem(
  pages: FirecrawlPage[],
): Promise<DesignSystemArtifacts> {
  const hints = extractDesignHints(pages);

  if (!anthropicClient) {
    return {
      tokens: buildFallbackTokens(hints),
      components: buildFallbackComponents(pages),
      designLanguage:
        "Custom design derived from source styles (Anthropic unavailable)",
    };
  }

  try {
    const payload = {
      hints,
      markdownSamples: hints.textSamples.slice(0, 3),
    };

    const response = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 900,
      temperature: 0.2,
      system:
        "You are a senior product designer. Produce polished design tokens and component guidelines. Output must be valid JSON matching the requested schema. Never include markdown fences or commentary.",
      messages: [
        {
          role: "user",
          content: `We crawled a website to reuse its visual language. Based on the extracted observations below, produce an elevated but faithful design system.

Return ONLY JSON matching:
{
  "tokens": {
    "name": string,
    "fonts": { "heading": string, "body": string },
    "color": {
      "brand": string,
      "brandAlt": string,
      "bg": string,
      "surface": string,
      "text": string,
      "muted": string
    },
    "radii": { "sm": number, "md": number, "lg": number },
    "shadow": { "sm": string, "md": string },
    "space": number[],
    "components": { "button": string, "card": string, "menu": string }
  },
  "components": Array<{
    "name": string,
    "purpose": string,
    "description": string,
    "keyStyles"?: string[],
    "usageNotes"?: string[]
  }>,
  "designLanguage": string
}

Constraints:
- Reuse detected colors and fonts where possible; refine for balance.
- Ensure tokens deliver a premium, production-ready aesthetic.
- Components must reflect patterns visible in the snippets.
- Limit arrays to at most 6 entries.

Extracted observations:
${JSON.stringify(payload, null, 2)}`,
        },
      ],
    });

    const text = sanitizeModelText(response.content);
    const parsed: unknown = JSON.parse(text);
    const validated = validateDesignSystemCandidate(parsed);

    if (validated) {
      // Ensure we still keep fallback defaults for any missing optional fields
      const fallbackTokens = buildFallbackTokens(hints);

      const mergedTokens: ThemeTokens = {
        ...fallbackTokens,
        ...validated.tokens,
        fonts: {
          ...fallbackTokens.fonts,
          ...validated.tokens.fonts,
        },
        color: {
          ...fallbackTokens.color,
          ...validated.tokens.color,
        },
        radii: {
          ...fallbackTokens.radii,
          ...validated.tokens.radii,
        },
        shadow: {
          ...fallbackTokens.shadow,
          ...validated.tokens.shadow,
        },
        components: {
          ...fallbackTokens.components,
          ...validated.tokens.components,
        },
      };

      return {
        tokens: mergedTokens,
        components:
          validated.components.length > 0
            ? validated.components.slice(0, 8)
            : buildFallbackComponents(pages),
        designLanguage:
          validated.designLanguage ||
          "Curated from design site (model generated description)",
      };
    }
  } catch (error) {
    console.error("Design system extraction failed, falling back:", error);
  }

  return {
    tokens: buildFallbackTokens(hints),
    components: buildFallbackComponents(pages),
    designLanguage:
      "Custom design derived from source styles (model fallback)",
  };
}
