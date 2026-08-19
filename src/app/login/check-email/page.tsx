export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/50 grid place-items-center text-[var(--accent-ink)] text-lg font-semibold">
          ✉
        </div>
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-[var(--text-muted)]">
          We sent a sign-in link to your inbox. It expires in 24 hours.
        </p>
      </div>
    </main>
  );
}
