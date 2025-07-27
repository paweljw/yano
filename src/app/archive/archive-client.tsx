"use client";

import {} from "react";
import { api } from "~/trpc/react";
import { TaskCard } from "../_components/task-card";

export function ArchiveClient() {
  const { data, isLoading, fetchNextPage, hasNextPage } =
    api.task.getArchive.useInfiniteQuery(
      { limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const tasks = data?.pages.flatMap((page) => page.tasks) ?? [];
  const utils = api.useUtils();

  const restoreTask = api.task.restore.useMutation({
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await utils.task.getArchive.cancel();

      // Optimistically remove the task from archive
      utils.task.getArchive.setInfiniteData({ limit: 20 }, (old) => {
        if (!old) return { pages: [], pageParams: [] };
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            tasks: page.tasks.filter((task) => task.id !== id),
          })),
        };
      });
    },
    onError: () => {
      // Rollback on error
      void utils.task.getArchive.invalidate();
    },
    onSettled: () => {
      // Always refetch after error or success
      void utils.task.getArchive.invalidate();
      void utils.task.getInbox.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-purple-500" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 text-6xl">📦</div>
        <h2 className="text-2xl font-semibold text-zinc-200">
          No completed tasks yet
        </h2>
        <p className="mt-2 text-zinc-500">
          Complete your first task to see it here
        </p>
      </div>
    );
  }

  const formatCompletionDate = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Group tasks by completion date
  const tasksByDate = tasks.reduce(
    (acc, task) => {
      if (!task.completedAt) return acc;
      const dateKey = formatCompletionDate(task.completedAt);
      acc[dateKey] ??= [];
      acc[dateKey].push(task);
      return acc;
    },
    {} as Record<string, typeof tasks>,
  );

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Archive</h1>
        <p className="mt-2 text-zinc-400">
          Your completed tasks • {tasks.length} task
          {tasks.length !== 1 ? "s" : ""} completed
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(tasksByDate).map(([date, dateTasks]) => (
          <div key={date}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-300">{date}</h2>
            <div className="space-y-4">
              {dateTasks.map((task) => (
                <div
                  key={task.id}
                  className="opacity-75 transition-opacity hover:opacity-100"
                >
                  <TaskCard
                    task={task}
                    actions={
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => restoreTask.mutate({ id: task.id })}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                          Restore
                        </button>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Completed
                        </div>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
