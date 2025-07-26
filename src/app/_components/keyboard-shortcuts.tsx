"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Navigation shortcuts
      switch (e.key.toLowerCase()) {
        case "i":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/inbox");
          }
          break;
        case "t":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/today");
          }
          break;
        case "a":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/archive");
          }
          break;
        case "r":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            router.push("/trash");
          }
          break;
        case "n":
          // New task shortcut (Cmd/Ctrl + N)
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            // Will trigger new task modal
            window.dispatchEvent(new CustomEvent("openNewTask"));
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [router, pathname]);

  return null;
}