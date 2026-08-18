export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-10 w-10 rounded-md bg-indigo-500/20 border border-indigo-500/40 grid place-items-center text-indigo-300 text-sm font-semibold">
          ✉
        </div>
        <h1 className="text-lg font-medium mb-2">Check your email</h1>
        <p className="text-sm text-neutral-400">
          We sent a sign-in link to your inbox. It expires in 24 hours.
        </p>
      </div>
    </main>
  );
}
