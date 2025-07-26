"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { TaskCard } from "../_components/task-card";
import { TaskTimer } from "../_components/task-timer";
import { EditTaskModal } from "../_components/edit-task-modal";
import { cn } from "~/lib/utils";
import { TaskStatus } from "@prisma/client";

export function TodayClient() {
  const { data: tasks, isLoading, refetch } = api.task.getToday.useQuery();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const utils = api.useUtils();

  const startTask = api.task.start.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getToday.cancel();
      const previousToday = utils.task.getToday.getData();
      
      // Optimistically update task status to IN_PROGRESS
      utils.task.getToday.setData(undefined, (old) => 
        old?.map(task => 
          task.id === id 
            ? { ...task, status: TaskStatus.IN_PROGRESS, lastStartedAt: new Date() }
            : task
        ) ?? []
      );
      
      return { previousToday };
    },
    onError: (err, newTodo, context) => {
      utils.task.getToday.setData(undefined, context?.previousToday);
    },
    onSettled: () => {
      utils.task.getToday.invalidate();
    },
  });

  const pauseTask = api.task.pause.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getToday.cancel();
      const previousToday = utils.task.getToday.getData();
      
      // Optimistically update task status to PAUSED
      utils.task.getToday.setData(undefined, (old) => 
        old?.map(task => 
          task.id === id 
            ? { ...task, status: TaskStatus.PAUSED, lastStartedAt: null }
            : task
        ) ?? []
      );
      
      return { previousToday };
    },
    onError: (err, newTodo, context) => {
      utils.task.getToday.setData(undefined, context?.previousToday);
    },
    onSettled: () => {
      utils.task.getToday.invalidate();
    },
  });

  const completeTask = api.task.complete.useMutation({
    onMutate: async ({ id }) => {
      await utils.task.getToday.cancel();
      const previousToday = utils.task.getToday.getData();
      
      // Optimistically remove the task (it's completed)
      utils.task.getToday.setData(undefined, (old) => 
        old?.filter(task => task.id !== id) ?? []
      );
      
      return { previousToday };
    },
    onError: (err, newTodo, context) => {
      utils.task.getToday.setData(undefined, context?.previousToday);
    },
    onSettled: () => {
      utils.task.getToday.invalidate();
    },
  });

  const toggleSubtask = api.task.toggleSubtask.useMutation({
    onMutate: async ({ taskId, subtaskId }) => {
      await utils.task.getToday.cancel();
      const previousToday = utils.task.getToday.getData();
      
      // Optimistically toggle subtask completion
      utils.task.getToday.setData(undefined, (old) => 
        old?.map(task => 
          task.id === taskId 
            ? {
                ...task,
                subtasks: task.subtasks.map(subtask =>
                  subtask.id === subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                )
              }
            : task
        ) ?? []
      );
      
      return { previousToday };
    },
    onError: (err, newTodo, context) => {
      utils.task.getToday.setData(undefined, context?.previousToday);
    },
    onSettled: () => {
      utils.task.getToday.invalidate();
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
          const selectedTask = tasks[selectedIndex];
          if (selectedTask && (selectedTask.status === TaskStatus.TODAY || selectedTask.status === TaskStatus.PAUSED)) {
            startTask.mutate({ id: selectedTask.id });
          }
          break;
        case "p":
          e.preventDefault();
          const taskToPause = tasks[selectedIndex];
          if (taskToPause && taskToPause.status === TaskStatus.IN_PROGRESS) {
            pauseTask.mutate({ id: taskToPause.id });
          }
          break;
        case "d":
          e.preventDefault();
          const taskToComplete = tasks[selectedIndex];
          if (taskToComplete && (taskToComplete.status === TaskStatus.IN_PROGRESS || taskToComplete.status === TaskStatus.PAUSED)) {
            completeTask.mutate({ id: taskToComplete.id });
          }
          break;
        case "e":
          e.preventDefault();
          const selectedTaskForEdit = tasks[selectedIndex];
          if (selectedTaskForEdit) {
            setEditingTask(selectedTaskForEdit);
            setIsEditModalOpen(true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [tasks, selectedIndex, startTask, pauseTask, completeTask]);

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
        <div className="mb-4 text-6xl">📅</div>
        <h2 className="text-2xl font-semibold text-zinc-200">No tasks for today</h2>
        <p className="mt-2 text-zinc-500">Visit your inbox to plan your day</p>
      </div>
    );
  }

  // Group tasks by status
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const pausedTasks = tasks.filter(t => t.status === TaskStatus.PAUSED);
  const todoTasks = tasks.filter(t => t.status === TaskStatus.TODAY);

  const orderedTasks = [...inProgressTasks, ...pausedTasks, ...todoTasks];

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100">Today</h1>
        <p className="mt-2 text-zinc-400">
          Your tasks for today • Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">?</kbd> for keyboard shortcuts
        </p>
      </div>

      {inProgressTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">In Progress</h2>
          <div className="space-y-4">
            {inProgressTasks.map((task, index) => {
              const globalIndex = orderedTasks.findIndex(t => t.id === task.id);
              return (
                <div
                  key={task.id}
                  className={cn(
                    "relative transition-all",
                    selectedIndex === globalIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 rounded-xl"
                  )}
                >
                  <TaskCard
                    task={task}
                    isSelected={selectedIndex === globalIndex}
                    onToggleSubtask={(subtaskId) => 
                      toggleSubtask.mutate({ taskId: task.id, subtaskId })
                    }
                    timer={
                      <TaskTimer
                        isRunning={true}
                        currentSessionStart={task.lastStartedAt}
                        totalTimeSpent={task.totalTimeSpent}
                        onStart={() => {}}
                        onPause={() => pauseTask.mutate({ id: task.id })}
                        onComplete={() => completeTask.mutate({ id: task.id })}
                      />
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pausedTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">Paused</h2>
          <div className="space-y-4">
            {pausedTasks.map((task) => {
              const globalIndex = orderedTasks.findIndex(t => t.id === task.id);
              return (
                <div
                  key={task.id}
                  className={cn(
                    "relative transition-all opacity-75",
                    selectedIndex === globalIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 rounded-xl opacity-100"
                  )}
                >
                  <TaskCard
                    task={task}
                    isSelected={selectedIndex === globalIndex}
                    onToggleSubtask={(subtaskId) => 
                      toggleSubtask.mutate({ taskId: task.id, subtaskId })
                    }
                    timer={
                      <TaskTimer
                        isRunning={false}
                        totalTimeSpent={task.totalTimeSpent}
                        onStart={() => startTask.mutate({ id: task.id })}
                        onPause={() => {}}
                        onComplete={() => completeTask.mutate({ id: task.id })}
                      />
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todoTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">To Do</h2>
          <div className="space-y-4">
            {todoTasks.map((task) => {
              const globalIndex = orderedTasks.findIndex(t => t.id === task.id);
              return (
                <div
                  key={task.id}
                  className={cn(
                    "relative transition-all",
                    selectedIndex === globalIndex && "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 rounded-xl"
                  )}
                >
                  <TaskCard
                    task={task}
                    isSelected={selectedIndex === globalIndex}
                    onToggleSubtask={(subtaskId) => 
                      toggleSubtask.mutate({ taskId: task.id, subtaskId })
                    }
                    actions={
                      <button
                        onClick={() => startTask.mutate({ id: task.id })}
                        className="rounded-lg bg-green-600/20 px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30"
                      >
                        ya
                      </button>
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
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