import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { pages: true },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            Portfolio Rebuilder
          </Link>
          <div className="flex gap-4">
            <Link
              href="/generate"
              className="text-sm text-slate-400 hover:text-slate-100"
            >
              Generate New Site
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Generated Sites</h1>
          <p className="text-slate-400">
            View and manage your generated portfolio sites
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <p className="mb-4 text-slate-400">No sites generated yet</p>
            <Link
              href="/generate"
              className="inline-block rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 hover:bg-sky-400"
            >
              Generate Your First Site
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/sites/${job.id}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-sky-500/50 hover:bg-slate-900/60"
              >
                <div className="mb-4">
                  <h3 className="mb-1 text-lg font-semibold group-hover:text-sky-400">
                    {job.domain}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.status} />
                    {job.category && (
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                        {job.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  {job.previewUrl && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-sky-400"
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
                      <span className="text-sky-400">Live Preview</span>
                    </div>
                  )}
                  {job.issueNumber && (
                    <div>Issue #{job.issueNumber}</div>
                  )}
                  {job.prUrl && (
                    <div className="truncate">PR Available</div>
                  )}
                  <div className="text-xs">
                    {job._count.pages} pages crawled
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  {new Date(job.createdAt).toLocaleDateString()} at{" "}
                  {new Date(job.createdAt).toLocaleTimeString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400",
    mapped: "bg-purple-500/20 text-purple-400",
    crawled: "bg-yellow-500/20 text-yellow-400",
    blueprinted: "bg-orange-500/20 text-orange-400",
    issued: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        colors[status] || "bg-slate-500/20 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
