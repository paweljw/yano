"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "~/lib/utils";

const navItems = [
  { href: "/inbox", label: "Inbox", shortcut: "i" },
  { href: "/today", label: "Today", shortcut: "t" },
  { href: "/archive", label: "Archive", shortcut: "a" },
  { href: "/trash", label: "Trash", shortcut: "r" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show navigation if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-sm font-bold text-white">Y</span>
              </div>
              <span className="text-xl font-bold text-white">YaNo</span>
            </Link>
            
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative rounded-lg px-4 py-2 text-sm font-medium transition-all",
                      "hover:bg-zinc-800/50",
                      pathname === item.href
                        ? "text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {item.label}
                    <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                      {item.shortcut}
                    </span>
                    {pathname === item.href && (
                      <div className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 translate-y-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90">
              + New Task
            </button>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{session.user.name || session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                title="Sign out"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}