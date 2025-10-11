export type SiteCategory =
  | "portfolio"
  | "blog"
  | "saas-landing"
  | "docs"
  | "event"
  | "restaurant";

export type JobStatus =
  | "new"
  | "mapped"
  | "crawled"
  | "blueprinted"
  | "issued"
  | "pr_open"
  | "failed";

export interface Blueprint {
  domain: string;
  nav: Array<{ text: string; href: string }>;
  pages: Array<{
    url: string;
    slug: string;
    title: string;
    sections: Array<{
      type: string;
      h1?: string;
      sub?: string;
      cta?: string;
      title?: string;
      content?: string;
    }>;
    images: string[];
  }>;
  assetsPolicy: {
    useOriginalImages: boolean;
    rewriteText: boolean;
  };
}

export interface ThemeTokens {
  name: string;
  fonts: {
    heading: string;
    body: string;
  };
  color: {
    brand: string;
    brandAlt: string;
    bg: string;
    surface: string;
    text: string;
    muted: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
  shadow: {
    sm: string;
    md: string;
  };
  space: number[];
  components: {
    button: string;
    card: string;
    menu: string;
  };
}

export interface FirecrawlPage {
  url: string;
  title?: string;
  markdown?: string;
  html?: string;
  links?: string[];
}
