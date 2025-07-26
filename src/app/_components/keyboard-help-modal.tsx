"use client";

import { useEffect } from "react";

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: "Navigation",
      items: [
        { keys: ["i"], description: "Go to Inbox" },
        { keys: ["t"], description: "Go to Today" },
        { keys: ["a"], description: "Go to Archive" },
        { keys: ["r"], description: "Go to Trash" },
        { keys: ["j"], description: "Move down in list" },
        { keys: ["k"], description: "Move up in list" },
      ],
    },
    {
      category: "Task Actions",
      items: [
        { keys: ["y"], description: "Start/Resume task (ya)" },
        { keys: ["n"], description: "Reject task (no)" },
        { keys: ["p"], description: "Pause/Postpone task" },
        { keys: ["d"], description: "Mark task as done" },
        { keys: ["e"], description: "Edit selected task" },
      ],
    },
    {
      category: "Global",
      items: [
        { keys: ["c"], description: "Create new task" },
        { keys: ["⌘", "N"], description: "Create new task" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close modals" },
      ],
    },
    {
      category: "In Forms",
      items: [
        { keys: ["⌘", "Enter"], description: "Submit form" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="min-w-[1.5rem] rounded bg-zinc-800 px-2 py-1 text-center text-xs font-mono text-zinc-400"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}