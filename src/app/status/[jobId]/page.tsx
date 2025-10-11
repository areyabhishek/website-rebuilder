import { ProgressTracker } from "@/components/ProgressTracker";

export default function StatusPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <a
            href="/generate"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
            Generate Another Site
          </a>
        </div>

        <ProgressTracker jobId={params.jobId} />
      </div>
    </div>
  );
}
