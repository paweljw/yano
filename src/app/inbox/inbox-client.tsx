"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { TaskCard } from "../_components/task-card";
import { EditTaskModal } from "../_components/edit-task-modal";
import { cn } from "~/lib/utils";
import type { Task } from "@prisma/client";

export function InboxClient() {
  const { data: tasks, isLoading } = api.task.getInbox.useQuery();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const utils = api.useUtils();

  const acceptTask = api.task.accept.useMutation({
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await utils.task.getInbox.cancel();

      // Snapshot the previous value
      const previousInbox = utils.task.getInbox.getData();

      // Optimistically update by removing the task
      utils.task.getInbox.setData(
        undefined,
        (old) => old?.filter((task) => task.id !== id) ?? [],
      );

      // Return a context object with the snapshot
      return { previousInbox };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context to roll back
      utils.task.getInbox.setData(undefined, context?.previousInbox);
    },
    onSettled: () => {
      // Always refetch after error or success
      void utils.task.getInbox.invalidate();
    },
  });

  const rejectTask = api.task.reject.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getInbox.cancel();
      const previousInbox = utils.task.getInbox.getData();

      utils.task.getInbox.setData(
        undefined,
        (old) => old?.filter((task) => task.id !== id) ?? [],
      );

      return { previousInbox };
    },
    onError: (err, newTodo, context) => {
      utils.task.getInbox.setData(undefined, context?.previousInbox);
    },
    onSettled: () => {
      void utils.task.getInbox.invalidate();
    },
  });

  const postponeTask = api.task.postpone.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getInbox.cancel();
      const previousInbox = utils.task.getInbox.getData();

      utils.task.getInbox.setData(
        undefined,
        (old) => old?.filter((task) => task.id !== id) ?? [],
      );

      return { previousInbox };
    },
    onError: (err, newTodo, context) => {
      utils.task.getInbox.setData(undefined, context?.previousInbox);
    },
    onSettled: () => {
      void utils.task.getInbox.invalidate();
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!tasks || tasks.length === 0) return;

      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

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
        case "e":
          e.preventDefault();
          const taskToEdit = tasks[selectedIndex];
          if (taskToEdit) {
            setEditingTask(taskToEdit);
            setIsEditModalOpen(true);
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
        <h2 className="text-2xl font-semibold text-zinc-200">
          Your inbox is empty
        </h2>
        <p className="mt-2 text-zinc-500">Create a new task to get started</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Inbox</h1>
        <p className="mt-2 text-zinc-400">
          Review and plan your tasks • Press{" "}
          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">?</kbd> for
          keyboard shortcuts
        </p>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "relative transition-all",
              selectedIndex === index &&
                "rounded-xl ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950",
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

      <EditTaskModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
}
