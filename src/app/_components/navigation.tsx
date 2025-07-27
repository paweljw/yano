"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "~/lib/utils";
import { NewTaskModal } from "./new-task-modal";
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

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
              >
                + New Task
              </button>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </nav>
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </>
  );
}
