import Link from "next/link";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/inbox");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-2xl font-bold text-white">Y</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Welcome to YaNo
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Your daily task planner for productivity enthusiasts
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">
              Plan your day, every day
            </h2>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-purple-400">✓</span>
                <span>
                  Review tasks in your inbox with simple ya/no/l8r decisions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-purple-400">✓</span>
                <span>Track time spent on tasks with built-in timers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-purple-400">✓</span>
                <span>
                  Navigate efficiently with vim-style keyboard shortcuts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-purple-400">✓</span>
                <span>Organize tasks by priority and spiciness level</span>
              </li>
            </ul>
          </div>

          <Link
            href="/api/auth/signin"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 py-3 text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span className="font-medium">Sign in with Discord</span>
          </Link>

          <p className="text-center text-xs text-zinc-500">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
