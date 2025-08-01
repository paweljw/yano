"use client";

import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "~/lib/store/StoreProvider";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import type { Task } from "@prisma/client";

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTaskModal = observer(function EditTaskModal({
  task,
  isOpen,
  onClose,
}: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [spiciness, setSpiciness] = useState(3);
  const [deadline, setDeadline] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const taskStore = useTaskStore();

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setSpiciness(task.spiciness);
      setDeadline(
        task.deadline ? (task.deadline.toISOString().split("T")[0] ?? "") : "",
      );
    }
  }, [task, isOpen]);

  useEffect(() => {
    if (isOpen && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isOpen]);

  const updateTask = api.task.update.useMutation({
    onSuccess: (updatedTask) => {
      // Update the task in the store
      taskStore.updateTask(updatedTask.id, updatedTask);
      onClose();
    },
  });

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

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateTask.mutate({
      id: task.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      spiciness,
      deadline: deadline ? new Date(deadline) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Edit Task
            </h2>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        "h-10 w-10 rounded-lg border-2 text-sm font-medium transition-all sm:h-8 sm:w-8",
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
                        "h-10 w-10 rounded-lg text-sm transition-all sm:h-8 sm:w-8",
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
              disabled={!title.trim() || updateTask.isPending}
              className="min-h-[44px] rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:min-h-0"
            >
              {updateTask.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
