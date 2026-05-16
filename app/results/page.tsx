import Link from "next/link";

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-10"
        >
          ← Back to today
        </Link>

        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Results</h1>
        <p className="text-sm text-zinc-600 mb-10">Daily card outcomes</p>

        <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-8 text-center">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <span className="text-zinc-600 text-sm">📋</span>
          </div>
          <p className="text-sm font-medium text-zinc-500">Coming soon</p>
          <p className="text-xs text-zinc-700 mt-2 max-w-xs mx-auto leading-relaxed">
            Game outcomes will appear here after each day&apos;s card completes.
          </p>
        </div>
      </div>
    </div>
  );
}
