"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useTaskStore } from "~/lib/store/StoreProvider";
import type { TaskStore } from "~/lib/store/task.store";
import { TaskCard } from "~/components/TaskCard";
import { TaskTimer } from "~/components/TaskTimer";
import { EditTaskModal } from "./EditTaskModal";
import { useKeyboardNavigation } from "~/hooks/useKeyboardNavigation";
import { cn } from "~/lib/utils";
import { TaskStatus } from "@prisma/client";
import type { Task as PrismaTask, Subtask } from "@prisma/client";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

type Task = PrismaTask & { subtasks: Subtask[] };

interface TaskListProps {
  view: "inbox" | "today" | "archive" | "trash";
  title: string;
  description: string;
  emptyState: {
    icon: string;
    title: string;
    message: string;
  };
}

export const TaskList = observer(function TaskList({
  view,
  title,
  description,
  emptyState,
}: TaskListProps) {
  const taskStore = useTaskStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get tasks based on view
  const tasks = (() => {
    switch (view) {
      case "inbox":
        return taskStore.inboxTasks;
      case "today":
        return taskStore.todayTasks;
      case "archive":
        return taskStore.archiveTasks;
      case "trash":
        return taskStore.trashTasks;
      default:
        return [];
    }
  })();

  const isLoading = taskStore.isLoadingView(view);
  const error = taskStore.getError(view);

  // Load data on mount
  useEffect(() => {
    switch (view) {
      case "inbox":
        void taskStore.loadInbox();
        break;
      case "today":
        void taskStore.loadToday();
        break;
      case "archive":
        void taskStore.loadArchive();
        break;
      case "trash":
        void taskStore.loadTrash();
        break;
    }
  }, [view, taskStore]);

  // Setup keyboard navigation based on view
  const keyboardOptions = (() => {
    switch (view) {
      case "inbox":
        return {
          onAccept: (task: Task) => taskStore.acceptTask(task.id),
          onReject: (task: Task) => taskStore.rejectTask(task.id),
          onPostpone: (task: Task) => taskStore.postponeTask(task.id),
        };
      case "today":
        return {
          onStart: (task: Task) =>
            task.status === TaskStatus.TODAY && taskStore.startTask(task.id),
          onPause: (task: Task) =>
            task.status === TaskStatus.IN_PROGRESS &&
            taskStore.pauseTask(task.id),
          onComplete: (task: Task) =>
            (task.status === TaskStatus.IN_PROGRESS ||
              task.status === TaskStatus.PAUSED) &&
            taskStore.completeTask(task.id),
        };
      default:
        return {};
    }
  })();

  const { selectedIndex } = useKeyboardNavigation({
    tasks,
    ...keyboardOptions,
    onEdit: (task: Task) => {
      setEditingTask(task);
      setIsEditModalOpen(true);
    },
    enabled: !isEditModalOpen,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="mb-4 text-6xl">❌</div>
        <h2 className="text-2xl font-semibold text-zinc-200">
          Error loading {view}
        </h2>
        <p className="mt-2 text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  // Render different layouts based on view
  if (view === "today") {
    const inProgressTasks = tasks.filter(
      (t) => t.status === TaskStatus.IN_PROGRESS,
    );
    const pausedTasks = tasks.filter((t) => t.status === TaskStatus.PAUSED);
    const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODAY);

    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            {description}
          </p>
        </div>

        {inProgressTasks.length > 0 && (
          <TaskSection
            title="In Progress"
            tasks={inProgressTasks}
            selectedIndex={selectedIndex}
            onToggleSubtask={(taskId, subtaskId) =>
              taskStore.toggleSubtaskMutation(taskId, subtaskId)
            }
            renderTimer={(task) => (
              <TaskTimer
                isRunning={true}
                currentSessionStart={task.lastStartedAt}
                totalTimeSpent={task.totalTimeSpent}
                onStart={() => undefined}
                onPause={() => taskStore.pauseTask(task.id)}
                onComplete={() => taskStore.completeTask(task.id)}
              />
            )}
          />
        )}

        {pausedTasks.length > 0 && (
          <TaskSection
            title="Paused"
            tasks={pausedTasks}
            selectedIndex={selectedIndex}
            className="opacity-75"
            onToggleSubtask={(taskId, subtaskId) =>
              taskStore.toggleSubtaskMutation(taskId, subtaskId)
            }
            renderTimer={(task) => (
              <TaskTimer
                isRunning={false}
                totalTimeSpent={task.totalTimeSpent}
                onStart={() => taskStore.startTask(task.id)}
                onPause={() => undefined}
                onComplete={() => taskStore.completeTask(task.id)}
              />
            )}
          />
        )}

        {todoTasks.length > 0 && (
          <TaskSection
            title="To Do"
            tasks={todoTasks}
            selectedIndex={selectedIndex}
            onToggleSubtask={(taskId, subtaskId) =>
              taskStore.toggleSubtaskMutation(taskId, subtaskId)
            }
            renderActions={(task) => (
              <button
                onClick={() => taskStore.startTask(task.id)}
                className="min-h-[44px] min-w-[44px] rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 sm:min-h-0 sm:min-w-0 sm:py-1.5"
              >
                ya
              </button>
            )}
          />
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

  // Default layout for other views
  return (
    <div className="container mx-auto p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-400 sm:text-base">{description}</p>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={cn(
              "relative transition-all",
              selectedIndex === index &&
                "rounded-xl ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950",
              view === "trash" && "opacity-50 hover:opacity-75",
            )}
          >
            <TaskCard
              task={task}
              isSelected={selectedIndex === index}
              onToggleSubtask={
                view === "inbox"
                  ? (subtaskId) =>
                      taskStore.toggleSubtaskMutation(task.id, subtaskId)
                  : undefined
              }
              actions={renderTaskActions(task, view, taskStore)}
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
});

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  selectedIndex: number;
  className?: string;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  renderTimer?: (task: Task) => React.ReactNode;
  renderActions?: (task: Task) => React.ReactNode;
}

function TaskSection({
  title,
  tasks,
  selectedIndex,
  className,
  onToggleSubtask,
  renderTimer,
  renderActions,
}: TaskSectionProps) {
  const allTasks = tasks;
  const globalIndexMap = new Map(
    allTasks.map((task, index) => [task.id, index]),
  );

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="mb-3 text-base font-semibold text-zinc-300 sm:mb-4 sm:text-lg">
        {title}
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {tasks.map((task) => {
          const globalIndex = globalIndexMap.get(task.id) ?? -1;
          return (
            <div
              key={task.id}
              className={cn(
                "relative transition-all",
                selectedIndex === globalIndex &&
                  "rounded-xl ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950",
                className,
              )}
            >
              <TaskCard
                task={task}
                isSelected={selectedIndex === globalIndex}
                onToggleSubtask={
                  onToggleSubtask
                    ? (subtaskId) => onToggleSubtask(task.id, subtaskId)
                    : undefined
                }
                timer={renderTimer?.(task)}
                actions={renderActions?.(task)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderTaskActions(task: Task, view: string, taskStore: TaskStore) {
  switch (view) {
    case "inbox":
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => taskStore.acceptTask(task.id)}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-green-600/20 px-3 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 sm:min-h-0 sm:min-w-0 sm:py-1.5"
          >
            ya
          </button>
          <button
            onClick={() => taskStore.postponeTask(task.id)}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-amber-600/20 px-3 py-2 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-600/30 sm:min-h-0 sm:min-w-0 sm:py-1.5"
          >
            l8r
          </button>
          <button
            onClick={() => taskStore.rejectTask(task.id)}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 sm:min-h-0 sm:min-w-0 sm:py-1.5"
          >
            no
          </button>
        </div>
      );

    case "archive":
    case "trash":
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => taskStore.restoreTask(task.id)}
            className="min-h-[44px] rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 sm:min-h-0 sm:py-1.5"
          >
            Restore
          </button>
          {view === "trash" && (
            <button
              onClick={() => taskStore.deleteTask(task.id)}
              className="min-h-[44px] rounded-lg bg-red-900/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-900/30 sm:min-h-0 sm:py-1.5"
            >
              Delete Forever
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
}
