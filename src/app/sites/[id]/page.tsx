import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import StylingEditor from "@/components/StylingEditor";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { url: "asc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const githubRepo = process.env.GITHUB_REPO || "";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            Portfolio Rebuilder
          </Link>
          <div className="flex gap-4">
            <Link
              href="/sites"
              className="text-sm text-slate-400 hover:text-slate-100"
            >
              All Sites
            </Link>
            <Link
              href="/generate"
              className="text-sm text-slate-400 hover:text-slate-100"
            >
              Generate New
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-3xl font-bold">{job.domain}</h1>
            <StatusBadge status={job.status} />
            {job.category && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {job.category}
              </span>
            )}
          </div>
          <p className="text-slate-400">
            Created on {new Date(job.createdAt).toLocaleDateString()} at{" "}
            {new Date(job.createdAt).toLocaleTimeString()}
          </p>
          {job.designDomain && (
            <p className="mt-1 text-sm text-slate-500">
              Design replicated from <span className="font-medium text-slate-300">{job.designDomain}</span>
            </p>
          )}
          {job.designLanguage && (
            <p className="text-sm text-slate-500">
              Visual language: <span className="font-medium text-slate-300">{job.designLanguage}</span>
            </p>
          )}
        </div>

        {/* Preview Section */}
        {job.previewUrl && (
          <div className="mb-8 rounded-xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent p-6">
            <div className="mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-sky-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <h2 className="text-xl font-semibold text-sky-400">
                Live Preview
              </h2>
            </div>
            <div className="mb-4">
              <a
                href={job.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-sky-300 hover:text-sky-200 hover:underline"
              >
                {job.previewUrl}
              </a>
            </div>
            <a
              href={job.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              View Generated Site
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        )}

        {/* Styling Editor */}
        <StylingEditor jobId={job.id} issueNumber={job.issueNumber} />

        {/* Links Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {job.issueNumber && (
            <a
              href={`https://github.com/${githubRepo}/issues/${job.issueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <div>
                <div className="text-sm font-medium">GitHub Issue</div>
                <div className="text-xs text-slate-400">
                  #{job.issueNumber}
                </div>
              </div>
            </a>
          )}

          {job.prUrl && (
            <a
              href={job.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium">Pull Request</div>
                <div className="text-xs text-slate-400">View PR</div>
              </div>
            </a>
          )}

          {job.blueprintUrl && (
            <a
              href={job.blueprintUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium">Blueprint</div>
                <div className="text-xs text-slate-400">View JSON</div>
              </div>
            </a>
          )}

          {job.tokensUrl && (
            <a
              href={job.tokensUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0V4m0 8v4m0 4v4"
                />
              </svg>
              <div>
                <div className="text-sm font-medium">Design Tokens</div>
                <div className="text-xs text-slate-400">View JSON</div>
              </div>
            </a>
          )}

          {job.componentsUrl && (
            <a
              href={job.componentsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/60"
            >
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6h12v12H6z"
                />
              </svg>
              <div>
                <div className="text-sm font-medium">Component Library</div>
                <div className="text-xs text-slate-400">Design specs</div>
              </div>
            </a>
          )}
        </div>

        {/* Pages List */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="mb-4 text-xl font-semibold">Crawled Pages</h2>
          {job.pages.length === 0 ? (
            <p className="text-slate-400">No pages crawled</p>
          ) : (
            <div className="space-y-2">
              {job.pages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="mb-1 font-medium">{page.title}</div>
                  <div className="text-sm text-slate-400">{page.url}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400",
    design_ready: "bg-sky-500/20 text-sky-400",
    mapped: "bg-purple-500/20 text-purple-400",
    crawled: "bg-yellow-500/20 text-yellow-400",
    blueprinted: "bg-orange-500/20 text-orange-400",
    issued: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        colors[status] || "bg-slate-500/20 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
