import { types, flow } from "mobx-state-tree";
import type { Task, Subtask } from "@prisma/client";
import { TaskStatus } from "@prisma/client";
import type { createTRPCClient } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";

type TRPCApi = ReturnType<typeof createTRPCClient<AppRouter>>;

export const SubtaskModel = types.model("Subtask", {
  id: types.identifier,
  title: types.string,
  completed: types.boolean,
  order: types.number,
  taskId: types.string,
  createdAt: types.Date,
  updatedAt: types.Date,
});

export const TimeSessionModel = types.model("TimeSession", {
  id: types.identifier,
  taskId: types.string,
  startedAt: types.Date,
  endedAt: types.maybeNull(types.Date),
  duration: types.maybeNull(types.number),
});

export const TaskModel = types
  .model("Task", {
    id: types.identifier,
    title: types.string,
    description: types.maybeNull(types.string),
    status: types.enumeration("TaskStatus", Object.values(TaskStatus)),
    priority: types.number,
    spiciness: types.number,
    deadline: types.maybeNull(types.Date),
    postponedUntil: types.maybeNull(types.Date),
    acceptedAt: types.maybeNull(types.Date),
    completedAt: types.maybeNull(types.Date),
    trashedAt: types.maybeNull(types.Date),
    totalTimeSpent: types.number,
    lastStartedAt: types.maybeNull(types.Date),
    userId: types.string,
    createdAt: types.Date,
    updatedAt: types.Date,
    subtasks: types.array(types.reference(SubtaskModel)),
    timeSessions: types.optional(types.array(TimeSessionModel), []),
  })
  .views((self) => ({
    get hasActiveSession() {
      return self.timeSessions.some((session) => !session.endedAt);
    },
    get completedSubtasksCount() {
      return self.subtasks.filter((subtask) => subtask.completed).length;
    },
    get isOverdue() {
      return self.deadline && new Date() > self.deadline;
    },
  }));

export const TaskStoreModel = types
  .model("TaskStore", {
    tasks: types.map(TaskModel),
    subtasks: types.map(SubtaskModel),
    selectedTaskId: types.maybeNull(types.string),
    isLoading: types.map(types.boolean),
    errors: types.map(types.string),
  })
  .volatile(() => ({
    api: null as TRPCApi | null,
  }))
  .views((self) => ({
    get inboxTasks() {
      const now = new Date();
      return Array.from(self.tasks.values())
        .filter(
          (task) =>
            task.status === TaskStatus.INBOX &&
            (!task.postponedUntil || task.postponedUntil <= now),
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) return b.priority - a.priority;
          if (a.deadline && b.deadline)
            return a.deadline.getTime() - b.deadline.getTime();
          if (a.deadline) return -1;
          if (b.deadline) return 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
    },

    get todayTasks() {
      return Array.from(self.tasks.values())
        .filter(
          (task) =>
            task.status === TaskStatus.TODAY ||
            task.status === TaskStatus.IN_PROGRESS ||
            task.status === TaskStatus.PAUSED,
        )
        .sort((a, b) => {
          const statusOrder: Record<string, number> = {
            [TaskStatus.IN_PROGRESS]: 0,
            [TaskStatus.PAUSED]: 1,
            [TaskStatus.TODAY]: 2,
          };
          const aOrder = statusOrder[a.status] ?? 3;
          const bOrder = statusOrder[b.status] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          if (a.priority !== b.priority) return b.priority - a.priority;
          if (a.acceptedAt && b.acceptedAt)
            return a.acceptedAt.getTime() - b.acceptedAt.getTime();
          return 0;
        });
    },

    get archiveTasks() {
      return Array.from(self.tasks.values())
        .filter((task) => task.status === TaskStatus.COMPLETED)
        .sort((a, b) => {
          if (a.completedAt && b.completedAt)
            return b.completedAt.getTime() - a.completedAt.getTime();
          return 0;
        });
    },

    get trashTasks() {
      return Array.from(self.tasks.values())
        .filter((task) => task.status === TaskStatus.TRASH)
        .sort((a, b) => {
          if (a.trashedAt && b.trashedAt)
            return b.trashedAt.getTime() - a.trashedAt.getTime();
          return 0;
        });
    },

    get selectedTask() {
      return self.selectedTaskId ? self.tasks.get(self.selectedTaskId) : null;
    },

    isLoadingView(view: string) {
      return self.isLoading.get(view) ?? false;
    },

    getError(view: string) {
      return self.errors.get(view);
    },
  }))
  .actions((self) => {
    const setApi = (trpcApi: TRPCApi) => {
      self.api = trpcApi;
    };

    const setLoading = (view: string, loading: boolean) => {
      self.isLoading.set(view, loading);
    };

    const setError = (view: string, error: string | null) => {
      if (error) {
        self.errors.set(view, error);
      } else {
        self.errors.delete(view);
      }
    };

    const addTask = (taskData: Task & { subtasks?: Subtask[] }) => {
      const { subtasks, ...task } = taskData;

      // Add subtasks first
      if (subtasks) {
        subtasks.forEach((subtask) => {
          self.subtasks.put(subtask);
        });
      }

      // Add task with subtask references
      self.tasks.put({
        ...task,
        subtasks: subtasks?.map((s) => s.id) ?? [],
      });
    };

    const removeTask = (taskId: string) => {
      const task = self.tasks.get(taskId);
      if (task) {
        // Remove associated subtasks
        task.subtasks.forEach((subtask) => {
          self.subtasks.delete(subtask.id);
        });
        self.tasks.delete(taskId);
      }
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
      const task = self.tasks.get(taskId);
      if (task) {
        Object.assign(task, updates);
      }
    };

    const toggleSubtask = (subtaskId: string) => {
      const subtask = self.subtasks.get(subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
      }
    };

    const selectTask = (taskId: string | null) => {
      self.selectedTaskId = taskId;
    };

    const loadInbox = flow(function* () {
      setLoading("inbox", true);
      setError("inbox", null);
      try {
        if (!self.api) throw new Error("API not initialized");
        const tasks = (yield self.api.task.getInbox.query()) as Array<
          Task & { subtasks: Subtask[] }
        >;
        tasks.forEach((task) => addTask(task));
      } catch (error) {
        setError(
          "inbox",
          error instanceof Error ? error.message : "Failed to load inbox",
        );
      } finally {
        setLoading("inbox", false);
      }
    });

    const loadToday = flow(function* () {
      setLoading("today", true);
      setError("today", null);
      try {
        if (!self.api) throw new Error("API not initialized");
        const tasks = (yield self.api.task.getToday.query()) as Array<
          Task & { subtasks: Subtask[] }
        >;
        tasks.forEach((task) => addTask(task));
      } catch (error) {
        setError(
          "today",
          error instanceof Error ? error.message : "Failed to load today",
        );
      } finally {
        setLoading("today", false);
      }
    });

    const loadArchive = flow(function* (cursor?: string) {
      setLoading("archive", true);
      setError("archive", null);
      try {
        if (!self.api) throw new Error("API not initialized");
        const result = (yield self.api.task.getArchive.query({
          limit: 20,
          cursor,
        })) as {
          tasks: Array<Task & { subtasks: Subtask[] }>;
          nextCursor: string | null;
        };
        result.tasks.forEach((task) => addTask(task));
        return result.nextCursor;
      } catch (error) {
        setError(
          "archive",
          error instanceof Error ? error.message : "Failed to load archive",
        );
        return null;
      } finally {
        setLoading("archive", false);
      }
    });

    const loadTrash = flow(function* () {
      setLoading("trash", true);
      setError("trash", null);
      try {
        if (!self.api) throw new Error("API not initialized");
        const tasks = (yield self.api.task.getTrash.query()) as Task[];
        tasks.forEach((task) => addTask({ ...task, subtasks: [] }));
      } catch (error) {
        setError(
          "trash",
          error instanceof Error ? error.message : "Failed to load trash",
        );
      } finally {
        setLoading("trash", false);
      }
    });

    const acceptTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;
      const previousAcceptedAt = task.acceptedAt;

      // Optimistic update
      updateTask(taskId, {
        status: TaskStatus.TODAY,
        acceptedAt: new Date(),
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.accept.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
          acceptedAt: previousAcceptedAt,
        });
        throw error;
      }
    });

    const rejectTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;
      const previousTrashedAt = task.trashedAt;

      // Optimistic update
      updateTask(taskId, {
        status: TaskStatus.TRASH,
        trashedAt: new Date(),
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.reject.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
          trashedAt: previousTrashedAt,
        });
        throw error;
      }
    });

    const postponeTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousPostponedUntil = task.postponedUntil;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Optimistic update
      updateTask(taskId, {
        postponedUntil: tomorrow,
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.postpone.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          postponedUntil: previousPostponedUntil,
        });
        throw error;
      }
    });

    const startTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;
      const previousLastStartedAt = task.lastStartedAt;
      const now = new Date();

      // Optimistic update
      updateTask(taskId, {
        status: TaskStatus.IN_PROGRESS,
        lastStartedAt: now,
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.start.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
          lastStartedAt: previousLastStartedAt,
        });
        throw error;
      }
    });

    const pauseTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;

      // Optimistic update
      updateTask(taskId, {
        status: TaskStatus.PAUSED,
        lastStartedAt: null,
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.pause.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
        });
        throw error;
      }
    });

    const completeTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;
      const previousCompletedAt = task.completedAt;
      const now = new Date();

      // Optimistic update
      updateTask(taskId, {
        status: TaskStatus.COMPLETED,
        completedAt: now,
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.complete.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
          completedAt: previousCompletedAt,
        });
        throw error;
      }
    });

    const toggleSubtaskMutation = flow(function* (
      taskId: string,
      subtaskId: string,
    ) {
      const subtask = self.subtasks.get(subtaskId);
      if (!subtask) return;

      const previousCompleted = subtask.completed;

      // Optimistic update
      toggleSubtask(subtaskId);

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.toggleSubtask.mutate({ taskId, subtaskId });
      } catch (error) {
        // Rollback on error
        subtask.completed = previousCompleted;
        throw error;
      }
    });

    const restoreTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      const previousStatus = task.status;

      // Optimistic update - restore to inbox
      updateTask(taskId, {
        status: TaskStatus.INBOX,
        trashedAt: null,
        completedAt: null,
      });

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.restore.mutate({ id: taskId });
      } catch (error) {
        // Rollback on error
        updateTask(taskId, {
          status: previousStatus,
        });
        throw error;
      }
    });

    const deleteTask = flow(function* (taskId: string) {
      const task = self.tasks.get(taskId);
      if (!task) return;

      // Store task data for rollback
      const taskData = { ...task };
      const subtasksData = task.subtasks.map((s) => ({ ...s }));

      // Optimistic delete
      removeTask(taskId);

      try {
        if (!self.api) throw new Error("API not initialized");
        yield self.api.task.delete.mutate({ id: taskId });
      } catch (error) {
        // Rollback - re-add task and subtasks
        subtasksData.forEach((subtask) => self.subtasks.put(subtask));
        self.tasks.put(taskData);
        throw error;
      }
    });

    return {
      setApi,
      setLoading,
      setError,
      addTask,
      removeTask,
      updateTask,
      toggleSubtask,
      selectTask,
      loadInbox,
      loadToday,
      loadArchive,
      loadTrash,
      acceptTask,
      rejectTask,
      postponeTask,
      startTask,
      pauseTask,
      completeTask,
      toggleSubtaskMutation,
      restoreTask,
      deleteTask,
    };
  });

export const RootStoreModel = types
  .model("RootStore", {
    taskStore: TaskStoreModel,
  })
  .actions((self) => ({
    setApi(api: TRPCApi) {
      self.taskStore.setApi(api);
    },
  }));

export const createRootStore = () => {
  return RootStoreModel.create({
    taskStore: {
      tasks: {},
      subtasks: {},
      selectedTaskId: null,
      isLoading: {},
      errors: {},
    },
  });
};

export type RootStore = ReturnType<typeof createRootStore>;
export type TaskStore = typeof TaskStoreModel.Type;
