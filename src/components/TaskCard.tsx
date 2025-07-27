"use client";

import { type ReactNode } from "react";
import { cn } from "~/lib/utils";
import type { Task, Subtask } from "@prisma/client";
import { formatTime } from "~/lib/timeUtils";

interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
}

interface TaskCardProps {
  task: TaskWithSubtasks;
  isSelected?: boolean;
  actions?: ReactNode;
  onToggleSubtask?: (subtaskId: string) => void;
  timer?: ReactNode;
}

export function TaskCard({
  task,
  isSelected,
  actions,
  onToggleSubtask,
  timer,
}: TaskCardProps) {
  const formatDeadline = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Overdue", className: "text-red-400" };
    if (days === 0) return { text: "Today", className: "text-amber-400" };
    if (days === 1) return { text: "Tomorrow", className: "text-blue-400" };
    if (days < 7) return { text: `${days} days`, className: "text-zinc-400" };
    return { text: date.toLocaleDateString(), className: "text-zinc-500" };
  };

  const deadline = formatDeadline(task.deadline);

  return (
    <div
      className={cn(
        "group rounded-xl border bg-zinc-900/50 p-4 transition-all sm:p-6",
        isSelected
          ? "border-purple-500/50 shadow-lg"
          : "border-zinc-800 hover:border-zinc-700",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1">
              {/* Priority indicator */}
              <div className="flex flex-col-reverse gap-0.5">
                {[...(Array(5) as unknown[])].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 w-4 rounded-full transition-colors",
                      i < task.priority
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-zinc-800",
                    )}
                  />
                ))}
              </div>

              {/* Spiciness indicator */}
              <div className="mt-2 flex gap-0.5">
                {[...(Array(task.spiciness) as unknown[])].map((_, i) => (
                  <span key={i} className="text-xs">
                    🌶️
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-100 sm:text-lg">
                {task.title}
              </h3>

              {task.description && (
                <p className="mt-1 text-sm text-zinc-400">{task.description}</p>
              )}

              {task.subtasks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {task.subtasks.map((subtask) => (
                    <label
                      key={subtask.id}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => onToggleSubtask?.(subtask.id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <span
                        className={cn(
                          subtask.completed && "line-through opacity-50",
                        )}
                      >
                        {subtask.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:gap-4">
                {deadline && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      deadline.className,
                    )}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {deadline.text}
                  </span>
                )}

                {task.totalTimeSpent > 0 && (
                  <span className="flex items-center gap-1 text-zinc-500">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatTime(task.totalTimeSpent)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {timer}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
