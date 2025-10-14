import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface VercelFile {
  file: string;
  data: string;
}

interface VercelDeployment {
  url: string;
  id: string;
}

/**
 * Recursively get all files from a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Deploy a directory to Vercel and return the preview URL
 */
export async function deployToVercel(
  dirPath: string,
  projectName: string
): Promise<VercelDeployment> {
  if (!process.env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN environment variable is not set");
  }

  // Get all files from the directory
  const allFiles = getAllFiles(dirPath);
  const files: VercelFile[] = allFiles.map((filePath) => {
    const relativePath = filePath.replace(dirPath + "/", "");
    const content = readFileSync(filePath, "utf-8");

    return {
      file: relativePath,
      data: content,
    };
  });

  console.log(`Deploying ${files.length} files to Vercel...`);

  // Create deployment
  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      files,
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
    throw new Error(`Vercel deployment failed: ${response.statusText}\n${error}`);
  }

  const deployment = await response.json();

  console.log(`Deployed to Vercel: ${deployment.url}`);

  return {
    url: `https://${deployment.url}`,
    id: deployment.id,
  };
}

/**
 * Update database with deployment info
 */
export async function updateJobWithDeployment(
  jobId: string,
  previewUrl: string,
  deploymentId: string
) {
  const { prisma } = await import("@/lib/prisma");

  await prisma.job.update({
    where: { id: jobId },
    data: {
      previewUrl,
      deploymentId,
    },
  });
}
