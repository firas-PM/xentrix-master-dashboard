import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.from ?? "/");

  const magicLinkEnabled = Boolean(process.env.RESEND_API_KEY);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-indigo-500/20 border border-indigo-500/40 grid place-items-center text-indigo-300 text-sm font-semibold">
            X
          </div>
          <div>
            <div className="text-sm text-neutral-400">Xentrix</div>
            <div className="text-base font-medium">Master Dashboard</div>
          </div>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              email: String(formData.get("email") ?? "").trim(),
              password: String(formData.get("password") ?? ""),
              redirectTo: params.from ?? "/",
            });
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@xentrix.xyz"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-neutral-400">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </label>

          {params.error ? (
            <p className="text-sm text-red-400">
              Wrong email or password. Try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium py-2 transition"
          >
            Sign in
          </button>
        </form>

        {magicLinkEnabled && (
          <>
            <div className="flex items-center gap-3 my-6 text-[10px] uppercase tracking-widest text-neutral-600">
              <div className="flex-1 h-px bg-neutral-900" />
              or
              <div className="flex-1 h-px bg-neutral-900" />
            </div>

            <form
              action={async (formData: FormData) => {
                "use server";
                await signIn("nodemailer", {
                  email: String(formData.get("email") ?? "").trim(),
                  redirectTo: params.from ?? "/",
                });
              }}
              className="space-y-3"
            >
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-neutral-400">
                  Or get a magic link
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@xentrix.xyz"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md border border-neutral-800 hover:border-neutral-600 text-neutral-300 text-sm font-medium py-2 transition"
              >
                Email me a login link
              </button>
            </form>
          </>
        )}

        <p className="text-xs text-neutral-500 text-center pt-6">
          Access is invite-only. Ask your brand admin.
        </p>
      </div>
    </main>
  );
}
