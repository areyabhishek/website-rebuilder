import allowlistData from "@/../config/allowlist.json";

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove www. prefix if present
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Invalid URL format");
  }
}

export function isAllowlisted(url: string): boolean {
  const domain = extractDomain(url);
  return allowlistData.some((allowed) => {
    // Remove www. from allowlist entries too
    const normalizedAllowed = allowed.replace(/^www\./, "");
    return domain === normalizedAllowed || domain.endsWith(`.${normalizedAllowed}`);
  });
}

export function getAllowlist(): string[] {
  return [...allowlistData];
}
