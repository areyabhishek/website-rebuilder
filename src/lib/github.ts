import { Octokit } from "@octokit/rest";
import type { Blueprint, ThemeTokens, SiteCategory } from "@/types";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function parseRepo(repoString: string): { owner: string; repo: string } {
  const [owner, repo] = repoString.split("/");
  if (!owner || !repo) {
    throw new Error(
      "Invalid GITHUB_REPO format. Expected: owner/repo-name"
    );
  }
  return { owner, repo };
}

export async function writeArtifacts(
  jobId: string,
  blueprint: Blueprint,
  tokens: ThemeTokens
): Promise<{ blueprintUrl: string; tokensUrl: string }> {
  const { owner, repo } = parseRepo(process.env.GITHUB_REPO!);

  // Write blueprint.json
  const blueprintPath = `artifacts/${jobId}/blueprint.json`;
  const blueprintContent = Buffer.from(
    JSON.stringify(blueprint, null, 2)
  ).toString("base64");

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: blueprintPath,
    message: `Add blueprint for ${blueprint.domain}`,
    content: blueprintContent,
  });

  // Write tokens.json
  const tokensPath = `artifacts/${jobId}/tokens.json`;
  const tokensContent = Buffer.from(JSON.stringify(tokens, null, 2)).toString(
    "base64"
  );

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: tokensPath,
    message: `Add theme tokens for ${blueprint.domain}`,
    content: tokensContent,
  });

  const blueprintUrl = `https://github.com/${owner}/${repo}/blob/main/${blueprintPath}`;
  const tokensUrl = `https://github.com/${owner}/${repo}/blob/main/${tokensPath}`;

  return { blueprintUrl, tokensUrl };
}

export async function createIssue(
  domain: string,
  category: SiteCategory,
  blueprintUrl: string,
  tokensUrl: string
): Promise<number> {
  const { owner, repo } = parseRepo(process.env.GITHUB_REPO!);

  const body = `## Site Rebuild Request

**Domain:** ${domain}
**Category:** ${category}

### Artifacts

- [Blueprint](${blueprintUrl})
- [Theme Tokens](${tokensUrl})

---

This issue was created automatically by the Portfolio Rebuilder. The generator action will process these artifacts and create a pull request with the new Astro site.
`;

  const response = await octokit.issues.create({
    owner,
    repo,
    title: `Rebuild: ${domain}`,
    body,
    labels: ["generate-site", category],
  });

  return response.data.number;
}
