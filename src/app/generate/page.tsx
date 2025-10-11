"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SubmissionState = "idle" | "submitting" | "complete";

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submitDisabled = useMemo(
    () => status === "submitting" || url.trim().length === 0,
    [status, url],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setError("Paste a URL from a domain you control.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError("Enter a valid https:// URL.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setStatus("complete");

      // Redirect to status page
      if (data.jobId) {
        router.push(`/status/${data.jobId}`);
      }
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to generate site");
    }
  };

  const statusMessage = useMemo(() => {
    switch (status) {
      case "submitting":
        return "Mapping, crawling, and generating artifacts… This may take a minute.";
      case "complete":
        return "✓ GitHub issue created! Check the new tab for your blueprint and tokens.";
      default:
        return "We'll map, crawl, classify, and create a GitHub issue with your artifacts.";
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <span className="text-lg font-semibold tracking-tight">
            Portfolio Site Rebuilder
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            MVP
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="grid gap-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Generate a rebuild-ready blueprint
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Paste a live URL from a domain on your allowlist. We’ll crawl up to
            25 pages, classify the site, and prep your GitHub issue with the
            blueprint and theme tokens.
          </p>
        </section>

        <form
          className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <label
              className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400"
              htmlFor="url"
            >
              Source URL
            </label>
            <input
              id="url"
              name="url"
              required
              autoComplete="off"
              inputMode="url"
              placeholder="https://www.example.com"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (error) {
                  setError(null);
                }
                if (status === "complete") {
                  setStatus("idle");
                }
              }}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
            />
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className="flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Generating…" : "Generate"}
          </button>

          <div className="grid gap-2 rounded-2xl bg-slate-950/70 p-4 text-sm text-slate-300">
            <p>{statusMessage}</p>
            {error ? (
              <p className="font-medium text-rose-400">{error}</p>
            ) : null}
          </div>
        </form>

        <section className="grid gap-3 rounded-3xl border border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Flow
            </h2>
            <ol className="mt-3 space-y-2 text-slate-200">
              <li>1. Verify the domain is on your allowlist.</li>
              <li>2. Map and crawl with Firecrawl.</li>
              <li>3. Generate blueprint and tokens.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Coming soon
            </h2>
            <ol className="mt-3 space-y-2 text-slate-200">
              <li>4. Open a GitHub issue with artifacts.</li>
              <li>5. Trigger the Astro generator action.</li>
              <li>6. Preview your rebuilt site on Vercel.</li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Phase 1 · UI scaffolding</span>
          <span className="font-mono text-slate-600">
            Awaiting Firecrawl + GitHub wiring
          </span>
        </div>
      </footer>
    </div>
  );
}
