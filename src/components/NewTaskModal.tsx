"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [spiciness, setSpiciness] = useState(3);
  const [deadline, setDeadline] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      void utils.task.getInbox.invalidate();
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setPriority(3);
      setSpiciness(3);
      setDeadline("");
      setSubtasks([]);
      setNewSubtask("");
    },
  });

  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isOpen]);

  // Handle Cmd/Ctrl + Enter to submit and ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (title.trim()) {
          const formEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          document.querySelector("form")?.dispatchEvent(formEvent);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, title, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      spiciness,
      deadline: deadline ? new Date(deadline) : undefined,
      subtasks: subtasks.filter((s) => s.trim()),
    });
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              New Task
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Add a new task to your inbox
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Title
              </label>
              <input
                ref={titleRef}
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                placeholder="Add more details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Priority ({priority})
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={cn(
                        "h-8 w-8 rounded-lg border-2 text-sm font-medium transition-all",
                        level <= priority
                          ? "border-purple-500 bg-purple-500/20 text-purple-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-600",
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Spiciness
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSpiciness(level)}
                      className={cn(
                        "h-8 w-8 rounded-lg text-sm transition-all",
                        level <= spiciness ? "opacity-100" : "opacity-30",
                      )}
                    >
                      🌶️
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="deadline"
                className="mb-1 block text-sm font-medium text-zinc-300"
              >
                Deadline (optional)
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Subtasks
              </label>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300">
                      {subtask}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                    placeholder="Add a subtask..."
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300 sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
              className="min-h-[44px] rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:min-h-0"
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
