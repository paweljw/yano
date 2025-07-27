"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "~/lib/utils";
import { NewTaskModal } from "./NewTaskModal";
import { UserImage } from "./UserImage";

const navItems = [
  { href: "/inbox", label: "Inbox", shortcut: "i" },
  { href: "/today", label: "Today", shortcut: "t" },
  { href: "/archive", label: "Archive", shortcut: "a" },
  { href: "/trash", label: "Trash", shortcut: "r" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Listen for new task event
  useEffect(() => {
    const handleOpenNewTask = () => setIsNewTaskModalOpen(true);
    window.addEventListener("openNewTask", handleOpenNewTask);
    return () => window.removeEventListener("openNewTask", handleOpenNewTask);
  }, []);

  // Don't show navigation if not authenticated
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-sm font-bold text-white">Y</span>
                </div>
                <span className="text-xl font-bold text-white">YaNo</span>
              </Link>

              <ul className="hidden items-center gap-1 sm:flex">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                        "hover:bg-zinc-800/50",
                        pathname === item.href
                          ? "text-white"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <span className="relative">
                        {item.label}
                        {pathname === item.href && (
                          <div className="absolute -bottom-3 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        )}
                      </span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                        {item.shortcut}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 sm:px-4"
              >
                <span className="hidden sm:inline">+ New Task</span>
                <span className="sm:hidden">+</span>
              </button>
              <div className="hidden h-8 w-px bg-zinc-800 sm:block" />
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 sm:flex">
                  <UserImage user={session.user} />
                  <span className="text-sm text-zinc-400">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
                  title="Sign out"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200 sm:hidden"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="border-b border-zinc-800 bg-zinc-900 sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="container mx-auto px-4 py-4">
            <h2 id="mobile-menu-title" className="sr-only">Mobile Menu</h2>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all",
                      "hover:bg-zinc-800/50",
                      pathname === item.href
                        ? "bg-zinc-800/30 text-white"
                        : "text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
                      {item.shortcut}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4">
              <UserImage user={session.user} />
              <span className="flex-1 text-sm text-zinc-400">
                {session.user.name ?? session.user.email}
              </span>
            </div>
          </div>
        </div>
      )}

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </>
  );
}
