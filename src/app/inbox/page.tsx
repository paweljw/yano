"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { TaskCard } from "../_components/task-card";
import { cn } from "~/lib/utils";

export default function InboxPage() {
  const { data: tasks, isLoading, refetch } = api.task.getInbox.useQuery();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const acceptTask = api.task.accept.useMutation({
    onSuccess: () => refetch(),
  });
  
  const rejectTask = api.task.reject.useMutation({
    onSuccess: () => refetch(),
  });
  
  const postponeTask = api.task.postpone.useMutation({
    onSuccess: () => refetch(),
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!tasks || tasks.length === 0) return;

      switch (e.key.toLowerCase()) {
        case "j":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, tasks.length - 1));
          break;
        case "k":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "y":
          e.preventDefault();
          const taskToAccept = tasks[selectedIndex];
          if (taskToAccept) {
            acceptTask.mutate({ id: taskToAccept.id });
            // Move selection to next task or previous if at end
            if (selectedIndex === tasks.length - 1 && selectedIndex > 0) {
              setSelectedIndex(selectedIndex - 1);
            }
          }
          break;
        case "n":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            const taskToReject = tasks[selectedIndex];
            if (taskToReject) {
              rejectTask.mutate({ id: taskToReject.id });
              // Move selection to next task or previous if at end
              if (selectedIndex === tasks.length - 1 && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1);
              }
            }
          }
          break;
        case "p":
          e.preventDefault();
          const taskToPostpone = tasks[selectedIndex];
          if (taskToPostpone) {
            postponeTask.mutate({ id: taskToPostpone.id });
            // Move selection to next task or previous if at end
            if (selectedIndex === tasks.length - 1 && selectedIndex > 0) {
              setSelectedIndex(selectedIndex - 1);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [tasks, selectedIndex, acceptTask, rejectTask, postponeTask]);

  // Reset selection when tasks change
  useEffect(() => {
    if (tasks && selectedIndex >= tasks.length) {
      setSelectedIndex(Math.max(0, tasks.length - 1));
    }
  }, [tasks, selectedIndex]);

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
        <div className="mb-4 text-6xl">📥</div>
        <h2 className="text-2xl font-semibold text-zinc-200">Your inbox is empty</h2>
        <p className="mt-2 text-zinc-500">Create a new task to get started</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Inbox</h1>
        <p className="mt-2 text-zinc-400">
          Review and plan your tasks • Use <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">j/k</kbd> to navigate, 
          <kbd className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs">y</kbd> for ya,
          <kbd className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs">n</kbd> for no,
          <kbd className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs">p</kbd> for l8r
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "relative transition-all",
              selectedIndex === index && "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 rounded-xl"
            )}
          >
            <TaskCard
              task={task}
              isSelected={selectedIndex === index}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptTask.mutate({ id: task.id })}
                    className="rounded-lg bg-green-600/20 px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30"
                  >
                    ya
                  </button>
                  <button
                    onClick={() => postponeTask.mutate({ id: task.id })}
                    className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-600/30"
                  >
                    l8r
                  </button>
                  <button
                    onClick={() => rejectTask.mutate({ id: task.id })}
                    className="rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
                  >
                    no
                  </button>
                </div>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}