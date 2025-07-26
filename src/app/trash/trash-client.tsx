"use client";

import { api } from "~/trpc/react";
import { TaskCard } from "../_components/task-card";
import type { Task } from "@prisma/client";

export function TrashClient() {
  const { data: tasks, isLoading, refetch } = api.task.getTrash.useQuery();
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-purple-500" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 text-6xl">🗑️</div>
        <h2 className="text-2xl font-semibold text-zinc-200">Trash is empty</h2>
        <p className="mt-2 text-zinc-500">Tasks you reject will appear here</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Trash</h1>
        <p className="mt-2 text-zinc-400">
          Rejected tasks • {tasks.length} item{tasks.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="opacity-50 transition-opacity hover:opacity-75">
            <TaskCard
              task={{...task, subtasks: []}}
              actions={
                <button
                  onClick={() => {
                    if (confirm("Permanently delete this task?")) {
                      deleteTask.mutate({ id: task.id });
                    }
                  }}
                  className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
                >
                  Delete
                </button>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}