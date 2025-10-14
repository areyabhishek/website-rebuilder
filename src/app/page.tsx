import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-10 px-6 py-20">
        <div className="space-y-6">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Portfolio Site Rebuilder
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Rebuild your site with a single URL.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Drop a domain you own into our generator to crawl, classify, and
            prep a blueprint with theme tokens. We’ll create the GitHub issue
            and queue the Astro rewrite for you.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/generate"
            className="flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40"
          >
            Launch generator
          </Link>
          <Link
            href="/sites"
            className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/40 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-slate-900/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-500/40"
          >
            View generated sites
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-3 text-sm text-slate-300">
          Generate sites with AI, view live previews, and request styling changes.
        </div>
      </main>
      <footer className="border-t border-slate-800 px-6 py-6 text-xs text-slate-500">
        Built with Next.js 15, Tailwind CSS, and Prisma.
      </footer>
    </div>
  );
}
