import { Octokit } from "@octokit/rest";
import type {
  Blueprint,
  ThemeTokens,
  SiteCategory,
  DesignComponentSpec,
} from "@/types";

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

interface DesignDetails {
  components?: DesignComponentSpec[];
  designLanguage?: string;
  designDomain?: string;
}

export async function writeArtifacts(
  jobId: string,
  blueprint: Blueprint,
  tokens: ThemeTokens,
  designDetails: DesignDetails = {},
): Promise<{
  blueprintUrl: string;
  tokensUrl: string;
  componentsUrl?: string;
}> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }

  if (!process.env.GITHUB_REPO) {
    throw new Error("GITHUB_REPO environment variable is not set");
  }

  const { owner, repo } = parseRepo(process.env.GITHUB_REPO);

  console.log(`Writing artifacts to ${owner}/${repo}`);

  // Write blueprint.json
  const blueprintPath = `artifacts/${jobId}/blueprint.json`;
  const blueprintContent = Buffer.from(
    JSON.stringify(blueprint, null, 2)
  ).toString("base64");

  console.log(`Creating blueprint at: ${blueprintPath}`);

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: blueprintPath,
      message: `Add blueprint for ${blueprint.domain}`,
      content: blueprintContent,
    });
  } catch (error) {
    console.error(`Failed to write blueprint to ${owner}/${repo}/${blueprintPath}`);
    throw error;
  }

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

  let componentsUrl: string | undefined;

  if (designDetails.components && designDetails.components.length > 0) {
    const componentsPath = `artifacts/${jobId}/components.json`;
    const componentsContent = Buffer.from(
      JSON.stringify(
        {
          designDomain: designDetails.designDomain ?? blueprint.domain,
          designLanguage:
            designDetails.designLanguage ?? "Design system derived from source",
          components: designDetails.components,
        },
        null,
        2,
      ),
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: componentsPath,
      message: `Add component guide for ${blueprint.domain}`,
      content: componentsContent,
    });

    componentsUrl = `https://github.com/${owner}/${repo}/blob/main/${componentsPath}`;
  }

  const blueprintUrl = `https://github.com/${owner}/${repo}/blob/main/${blueprintPath}`;
  const tokensUrl = `https://github.com/${owner}/${repo}/blob/main/${tokensPath}`;

  return { blueprintUrl, tokensUrl, componentsUrl };
}

export async function createIssue(
  domain: string,
  category: SiteCategory,
  blueprintUrl: string,
  tokensUrl: string,
  componentsUrl?: string,
  designLanguage?: string,
): Promise<number> {
  const { owner, repo } = parseRepo(process.env.GITHUB_REPO!);

  const body = `## Site Rebuild Request

**Domain:** ${domain}
**Category:** ${category}

### Artifacts

- [Blueprint](${blueprintUrl})
- [Theme Tokens](${tokensUrl})
${componentsUrl ? `- [Component Library](${componentsUrl})\n` : ""}

---

Design language: ${designLanguage ?? "Derived from source design"}

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
