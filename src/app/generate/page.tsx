"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SubmissionState = "idle" | "submitting" | "complete";

export default function GeneratePage() {
  const [designUrl, setDesignUrl] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [status, setStatus] = useState<SubmissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submitDisabled = useMemo(
    () =>
      status === "submitting" ||
      designUrl.trim().length === 0 ||
      contentUrl.trim().length === 0,
    [status, designUrl, contentUrl],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const designTrimmed = designUrl.trim();
    const contentTrimmed = contentUrl.trim();

    if (!designTrimmed || !contentTrimmed) {
      setError("Provide both a design source URL and a content source URL.");
      return;
    }

    try {
      new URL(designTrimmed);
      new URL(contentTrimmed);
    } catch {
      setError("Both fields must contain valid https:// URLs.");
      return;
    }

    if (designTrimmed === contentTrimmed) {
      setError("Use different URLs to transfer design to new content.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designUrl: designTrimmed,
          contentUrl: contentTrimmed,
        }),
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
        return "Extracting the design system and crawling your content… this may take a minute.";
      case "complete":
        return "✓ GitHub issue created! Blueprint, design tokens, and components are ready.";
      default:
        return "We’ll capture the design DNA from the reference site, crawl your content, and open a GitHub issue with all artifacts.";
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
            Merge the perfect design with your content
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Choose a reference site whose design you love, and a second site
            whose content you want to preserve. We&apos;ll extract the design
            system from the first and rebuild the second with that polish.
          </p>
          <div className="rounded-lg bg-amber-900/20 border border-amber-700/30 p-4">
            <p className="text-sm text-amber-200">
              <strong>Tip:</strong> Use a focused section or landing page for
              both URLs (10 pages or fewer) to maximise fidelity and keep
              generation fast.
            </p>
          </div>
        </section>

        <form
          className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400"
                htmlFor="design-url"
              >
                Design source URL
              </label>
              <input
                id="design-url"
                name="designUrl"
                required
                autoComplete="off"
                inputMode="url"
                placeholder="https://design-reference.com"
                value={designUrl}
                onChange={(event) => {
                  setDesignUrl(event.target.value);
                  if (error) {
                    setError(null);
                  }
                  if (status === "complete") {
                    setStatus("idle");
                  }
                }}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
              />
              <p className="text-xs text-slate-500">
                We copy the palette, typography, and component system from this
                site.
              </p>
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400"
                htmlFor="content-url"
              >
                Content source URL
              </label>
              <input
                id="content-url"
                name="contentUrl"
                required
                autoComplete="off"
                inputMode="url"
                placeholder="https://content-source.com"
                value={contentUrl}
                onChange={(event) => {
                  setContentUrl(event.target.value);
                  if (error) {
                    setError(null);
                  }
                  if (status === "complete") {
                    setStatus("idle");
                  }
                }}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg text-slate-100 shadow-inner shadow-black/30 transition focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
              />
              <p className="text-xs text-slate-500">
                Crawled copy, structure, and assets come from here.
              </p>
            </div>
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
              <li>2. Extract tokens & components from design site.</li>
              <li>3. Map & crawl the content site.</li>
              </ol>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Coming soon
            </h2>
            <ol className="mt-3 space-y-2 text-slate-200">
              <li>4. Open a GitHub issue with blueprint + design system.</li>
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
