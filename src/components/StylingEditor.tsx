"use client";

import { useState } from "react";

interface StylingEditorProps {
  jobId: string;
  issueNumber: number | null;
}

export default function StylingEditor({
  jobId,
  issueNumber,
}: StylingEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    issueUrl?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          prompt: prompt.trim(),
          issueNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Styling update request submitted successfully!",
          issueUrl: data.issueUrl,
        });
        setPrompt("");
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to submit styling request",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">Request Styling Changes</h2>
        <p className="text-sm text-slate-400">
          Describe styling changes you'd like to make. Only visual styles will
          be modified - content and structure remain unchanged.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="styling-prompt" className="mb-2 block text-sm">
            Styling Instructions
          </label>
          <textarea
            id="styling-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Change the color scheme to warm earth tones with a terracotta primary color, use a serif font for headings, and add subtle animations to the buttons..."
            className="h-32 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !prompt.trim()}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Request Styling Update
            </>
          )}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            result.success
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          <div className="mb-2 font-medium">
            {result.success ? "Success!" : "Error"}
          </div>
          <div className="text-sm">{result.message}</div>
          {result.issueUrl && (
            <a
              href={result.issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm underline hover:no-underline"
            >
              View GitHub Issue →
            </a>
          )}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
        <h3 className="mb-2 text-sm font-medium text-slate-300">
          Example Prompts:
        </h3>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>• "Use a dark mode color scheme with purple accents"</li>
          <li>• "Make the design more minimal and modern"</li>
          <li>• "Add gradients to the backgrounds and animated hover effects"</li>
          <li>• "Change to a warm, vintage aesthetic with sepia tones"</li>
          <li>
            • "Use the Inter font family and increase spacing for better
            readability"
          </li>
        </ul>
      </div>
    </div>
  );
}
