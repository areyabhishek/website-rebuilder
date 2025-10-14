import { ProgressTracker } from "@/components/ProgressTracker";
import Link from "next/link";

export default function StatusPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            Portfolio Rebuilder
          </Link>
          <div className="flex gap-4 text-sm">
            <Link
              href="/sites"
              className="text-slate-400 hover:text-slate-100"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Other Sites →
            </Link>
            <Link
              href="/generate"
              className="text-slate-400 hover:text-slate-100"
            >
              Generate Another
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <ProgressTracker jobId={params.jobId} />
      </main>
    </div>
  );
}
