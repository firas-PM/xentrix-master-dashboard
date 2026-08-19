"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
          Xentrix · Something went wrong
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          That page just crashed.
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {error.digest ? (
            <>
              Error id{" "}
              <code className="font-mono text-xs bg-[var(--bg-sunken)] rounded px-1.5 py-0.5">
                {error.digest}
              </code>{" "}
              — send it along if you report this.
            </>
          ) : (
            <>Try again, or head back to the dashboard.</>
          )}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] text-sm font-medium px-4 py-2 transition"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
