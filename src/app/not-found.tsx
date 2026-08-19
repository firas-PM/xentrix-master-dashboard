import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-subtle)]">
          Xentrix · 404
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          That page isn&apos;t here.
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Broken link, moved page, or a resource you no longer have access to.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition inline-block"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
