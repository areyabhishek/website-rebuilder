import type { SiteCategory, ThemeTokens } from "@/types";

const THEME_PACKS: Record<SiteCategory, ThemeTokens> = {
  portfolio: {
    name: "portfolio-modern",
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
    color: {
      brand: "#3b82f6",
      brandAlt: "#8b5cf6",
      bg: "#0f172a",
      surface: "#1e293b",
      text: "#f1f5f9",
      muted: "#94a3b8",
    },
    radii: {
      sm: 8,
      md: 16,
      lg: 24,
    },
    shadow: {
      sm: "0 1px 3px rgba(0, 0, 0, 0.12)",
      md: "0 8px 32px rgba(0, 0, 0, 0.24)",
    },
    space: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
    components: {
      button: "rounded",
      card: "elevated",
      menu: "sticky",
    },
  },

  blog: {
    name: "blog-clean",
    fonts: {
      heading: "Merriweather",
      body: "Source Sans Pro",
    },
    color: {
      brand: "#059669",
      brandAlt: "#0891b2",
      bg: "#ffffff",
      surface: "#f9fafb",
      text: "#111827",
      muted: "#6b7280",
    },
    radii: {
      sm: 4,
      md: 8,
      lg: 12,
    },
    shadow: {
      sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
      md: "0 4px 16px rgba(0, 0, 0, 0.08)",
    },
    space: [0, 4, 8, 16, 24, 32, 48, 64, 96, 128],
    components: {
      button: "minimal",
      card: "bordered",
      menu: "inline",
    },
  },

  "saas-landing": {
    name: "saas-fresh",
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
    color: {
      brand: "#2563eb",
      brandAlt: "#22c55e",
      bg: "#0b1020",
      surface: "#0f172a",
      text: "#e5e7eb",
      muted: "#94a3b8",
    },
    radii: {
      sm: 6,
      md: 12,
      lg: 20,
    },
    shadow: {
      sm: "0 1px 2px rgb(0 0 0 / 0.1)",
      md: "0 6px 24px rgb(0 0 0 / 0.2)",
    },
    space: [0, 4, 8, 12, 16, 24, 32, 48, 64],
    components: {
      button: "pill",
      card: "soft",
      menu: "sticky",
    },
  },

  docs: {
    name: "docs-clarity",
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
    color: {
      brand: "#6366f1",
      brandAlt: "#8b5cf6",
      bg: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      muted: "#64748b",
    },
    radii: {
      sm: 6,
      md: 10,
      lg: 16,
    },
    shadow: {
      sm: "0 1px 2px rgba(0, 0, 0, 0.06)",
      md: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    space: [0, 4, 8, 12, 16, 20, 24, 32, 48, 64],
    components: {
      button: "rounded",
      card: "bordered",
      menu: "sidebar",
    },
  },

  event: {
    name: "event-vibrant",
    fonts: {
      heading: "Playfair Display",
      body: "Lato",
    },
    color: {
      brand: "#dc2626",
      brandAlt: "#f59e0b",
      bg: "#18181b",
      surface: "#27272a",
      text: "#fafafa",
      muted: "#a1a1aa",
    },
    radii: {
      sm: 8,
      md: 16,
      lg: 24,
    },
    shadow: {
      sm: "0 2px 4px rgba(0, 0, 0, 0.12)",
      md: "0 8px 24px rgba(0, 0, 0, 0.2)",
    },
    space: [0, 4, 8, 16, 24, 32, 48, 64, 80],
    components: {
      button: "rounded",
      card: "elevated",
      menu: "sticky",
    },
  },

  restaurant: {
    name: "restaurant-elegant",
    fonts: {
      heading: "Cormorant Garamond",
      body: "Crimson Text",
    },
    color: {
      brand: "#92400e",
      brandAlt: "#b45309",
      bg: "#fefce8",
      surface: "#fef3c7",
      text: "#451a03",
      muted: "#78350f",
    },
    radii: {
      sm: 4,
      md: 8,
      lg: 16,
    },
    shadow: {
      sm: "0 1px 3px rgba(0, 0, 0, 0.1)",
      md: "0 6px 20px rgba(0, 0, 0, 0.15)",
    },
    space: [0, 8, 16, 24, 32, 40, 48, 64, 96],
    components: {
      button: "minimal",
      card: "soft",
      menu: "sticky",
    },
  },
};

export function generateTokens(category: SiteCategory): ThemeTokens {
  return THEME_PACKS[category];
}
