"use client";

import { useEffect, useState } from "react";

interface Step {
  name: string;
  status: string;
  conclusion: string | null;
}

interface ActionStatus {
  status: string;
  conclusion: string | null;
  url: string;
  steps?: Step[];
}

interface JobStatus {
  jobId: string;
  domain: string;
  status: string;
  category?: string;
  issueNumber?: number;
  issueUrl?: string;
  prUrl?: string;
  actionStatus?: ActionStatus;
}

const STAGE_MAP: Record<string, { label: string; description: string }> = {
  new: { label: "Starting", description: "Initializing job..." },
  mapped: { label: "Mapping", description: "Discovering site structure..." },
  crawled: { label: "Crawling", description: "Extracting content from pages..." },
  blueprinted: { label: "Analyzing", description: "Creating site blueprint..." },
  issued: { label: "Generating", description: "Creating Astro site with AI..." },
  pr_open: { label: "Complete", description: "Pull request created!" },
  failed: { label: "Failed", description: "An error occurred" },
};

export function ProgressTracker({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/status/${jobId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        const data = await response.json();
        setStatus(data);

        // Stop polling if completed or failed
        if (
          data.status === "pr_open" ||
          data.status === "failed" ||
          (data.actionStatus?.status === "completed" &&
            data.actionStatus?.conclusion === "success")
        ) {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, [jobId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span>Loading status...</span>
      </div>
    );
  }

  const currentStage = STAGE_MAP[status.status] || STAGE_MAP.new;
  const isComplete = status.status === "pr_open" || status.actionStatus?.conclusion === "success";
  const isFailed = status.status === "failed" || status.actionStatus?.conclusion === "failure";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {status.domain}
        </h2>
        {status.category && (
          <p className="text-sm text-gray-600">
            Type: <span className="font-medium">{status.category}</span>
          </p>
        )}
      </div>

      {/* Main Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStage.label}
            </h3>
            <p className="text-sm text-gray-600">{currentStage.description}</p>
          </div>
          {!isComplete && !isFailed && (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          )}
          {isComplete && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-500 ${
              isFailed ? "bg-red-600" : "bg-blue-600"
            }`}
            style={{
              width: getProgressPercentage(status.status, status.actionStatus),
            }}
          ></div>
        </div>
      </div>

      {/* GitHub Action Steps */}
      {status.actionStatus?.steps && status.actionStatus.steps.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="mb-4 font-semibold text-gray-900">
            Build Steps
          </h4>
          <div className="space-y-2">
            {status.actionStatus.steps
              .filter((step) => !step.name.startsWith("Post") && !step.name.includes("job"))
              .map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-sm"
                >
                  {step.status === "completed" && step.conclusion === "success" && (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-green-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                  {step.status === "completed" && step.conclusion === "failure" && (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-red-600"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  )}
                  {step.status === "in_progress" && (
                    <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  )}
                  {step.status === "queued" && (
                    <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300"></div>
                  )}
                  {step.status === "completed" && step.conclusion === "skipped" && (
                    <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300"></div>
                  )}
                  <span
                    className={
                      step.status === "completed" && step.conclusion === "failure"
                        ? "text-red-600"
                        : "text-gray-700"
                    }
                  >
                    {step.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        {status.issueUrl && (
          <a
            href={status.issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View Issue
          </a>
        )}
        {status.actionStatus?.url && (
          <a
            href={status.actionStatus.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            View Action
          </a>
        )}
        {status.prUrl && (
          <a
            href={status.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            View Pull Request
          </a>
        )}
      </div>
    </div>
  );
}

function getProgressPercentage(
  status: string,
  actionStatus?: ActionStatus
): string {
  const stages = ["new", "mapped", "crawled", "blueprinted", "issued"];
  const currentIndex = stages.indexOf(status);

  if (status === "failed") return "100%";
  if (status === "pr_open") return "100%";

  if (actionStatus?.status === "completed") {
    return actionStatus.conclusion === "success" ? "100%" : "100%";
  }

  if (status === "issued" && actionStatus) {
    // We're in the GitHub Action phase
    // Base progress is 80% (we've completed the API phase)
    // The remaining 20% is divided among action steps
    const steps = actionStatus.steps || [];
    const relevantSteps = steps.filter(
      (s) => !s.name.startsWith("Post") && !s.name.includes("job")
    );
    const completedSteps = relevantSteps.filter(
      (s) => s.status === "completed" && s.conclusion === "success"
    ).length;

    const actionProgress = relevantSteps.length
      ? (completedSteps / relevantSteps.length) * 20
      : 0;

    return `${Math.min(80 + actionProgress, 100)}%`;
  }

  // Calculate progress based on current stage (0-80%)
  if (currentIndex === -1) return "10%";

  const stageProgress = ((currentIndex + 1) / stages.length) * 80;
  return `${Math.min(stageProgress, 80)}%`;
}
