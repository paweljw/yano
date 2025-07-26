import { z } from "zod";
import { TaskStatus } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

// Helper to check if daily reset is needed
const needsDailyReset = (lastResetDate: Date): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  
  // Reset if we're on a different day
  return now.toDateString() !== lastReset.toDateString();
};

// Perform daily reset for a user
const performDailyReset = async (ctx: any, userId: string) => {
  const now = new Date();
  
  // Start a transaction to ensure consistency
  await ctx.db.$transaction(async (tx: any) => {
    // 1. Move PAUSED tasks back to TODAY (user was working on them)
    await tx.task.updateMany({
      where: {
        userId,
        status: TaskStatus.PAUSED,
      },
      data: {
        status: TaskStatus.TODAY,
      },
    });
    
    // 2. Move untouched TODAY tasks back to INBOX
    await tx.task.updateMany({
      where: {
        userId,
        status: TaskStatus.TODAY,
      },
      data: {
        status: TaskStatus.INBOX,
        acceptedAt: null,
      },
    });
    
    // 3. Clear expired postponedUntil dates
    await tx.task.updateMany({
      where: {
        userId,
        postponedUntil: {
          lte: now,
        },
      },
      data: {
        postponedUntil: null,
      },
    });
    
    // 4. Update user's lastResetDate
    await tx.user.update({
      where: { id: userId },
      data: { lastResetDate: now },
    });
  });
};

export const taskRouter = createTRPCRouter({
  // Get inbox tasks (not postponed)
  getInbox: protectedProcedure.query(async ({ ctx }) => {
    // Check if daily reset is needed
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { lastResetDate: true },
    });
    
    if (user && needsDailyReset(user.lastResetDate)) {
      await performDailyReset(ctx, ctx.session.user.id);
    }

    const now = new Date();
    return ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: TaskStatus.INBOX,
        OR: [
          { postponedUntil: null },
          { postponedUntil: { lte: now } },
        ],
      },
      include: {
        subtasks: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: [
        { priority: "desc" },
        { deadline: "asc" },
        { createdAt: "asc" },
      ],
    });
  }),

  // Get today's tasks
  getToday: protectedProcedure.query(async ({ ctx }) => {
    // Check if daily reset is needed
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { lastResetDate: true },
    });
    
    if (user && needsDailyReset(user.lastResetDate)) {
      await performDailyReset(ctx, ctx.session.user.id);
    }

    return ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: {
          in: [TaskStatus.TODAY, TaskStatus.IN_PROGRESS, TaskStatus.PAUSED],
        },
      },
      include: {
        subtasks: {
          orderBy: { order: "asc" },
        },
        timeSessions: {
          orderBy: { startedAt: "desc" },
        },
      },
      orderBy: [
        { status: "asc" }, // IN_PROGRESS first, then PAUSED, then TODAY
        { priority: "desc" },
        { acceptedAt: "asc" },
      ],
    });
  }),

  // Get archived tasks
  getArchive: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const tasks = await ctx.db.task.findMany({
        where: {
          userId: ctx.session.user.id,
          status: TaskStatus.COMPLETED,
        },
        include: {
          subtasks: {
            orderBy: { order: "asc" },
          },
          timeSessions: true,
        },
        orderBy: { completedAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (tasks.length > limit) {
        const nextItem = tasks.pop();
        nextCursor = nextItem!.id;
      }

      return {
        tasks,
        nextCursor,
      };
    }),

  // Get trash
  getTrash: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({
      where: {
        userId: ctx.session.user.id,
        status: TaskStatus.TRASH,
      },
      orderBy: { trashedAt: "desc" },
    });
  }),

  // Create a new task
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.number().min(1).max(5).default(3),
      spiciness: z.number().min(1).max(5).default(3),
      deadline: z.date().optional(),
      subtasks: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { subtasks, ...taskData } = input;
      
      return ctx.db.task.create({
        data: {
          ...taskData,
          userId: ctx.session.user.id,
          subtasks: subtasks ? {
            create: subtasks.map((title, index) => ({
              title,
              order: index,
            })),
          } : undefined,
        },
        include: {
          subtasks: true,
        },
      });
    }),

  // Accept task (move to TODAY)
  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: TaskStatus.TODAY,
          acceptedAt: new Date(),
        },
      });
    }),

  // Reject task (move to TRASH)
  reject: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: TaskStatus.TRASH,
          trashedAt: new Date(),
        },
      });
    }),

  // Postpone task
  postpone: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return ctx.db.task.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          postponedUntil: tomorrow,
        },
      });
    }),

  // Start task
  start: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      
      // Create a new time session
      await ctx.db.timeSession.create({
        data: {
          taskId: input.id,
          startedAt: now,
        },
      });

      return ctx.db.task.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: TaskStatus.IN_PROGRESS,
          lastStartedAt: now,
        },
      });
    }),

  // Pause task
  pause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          timeSessions: {
            where: { endedAt: null },
            orderBy: { startedAt: "desc" },
            take: 1,
          },
        },
      });

      if (!task || task.timeSessions.length === 0) {
        throw new Error("No active time session found");
      }

      const activeSession = task.timeSessions[0]!;
      const now = new Date();
      const duration = Math.floor((now.getTime() - activeSession.startedAt.getTime()) / 1000);

      // End the current time session
      await ctx.db.timeSession.update({
        where: { id: activeSession.id },
        data: {
          endedAt: now,
          duration,
        },
      });

      // Update task
      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: TaskStatus.PAUSED,
          totalTimeSpent: {
            increment: duration,
          },
        },
      });
    }),

  // Complete task
  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          timeSessions: {
            where: { endedAt: null },
            orderBy: { startedAt: "desc" },
            take: 1,
          },
        },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const now = new Date();
      
      // End any active time session
      if (task.timeSessions.length > 0) {
        const activeSession = task.timeSessions[0]!;
        const duration = Math.floor((now.getTime() - activeSession.startedAt.getTime()) / 1000);

        await ctx.db.timeSession.update({
          where: { id: activeSession.id },
          data: {
            endedAt: now,
            duration,
          },
        });

        // Update task with completed status and final time
        return ctx.db.task.update({
          where: { id: input.id },
          data: {
            status: TaskStatus.COMPLETED,
            completedAt: now,
            totalTimeSpent: {
              increment: duration,
            },
          },
        });
      }

      // Just mark as completed if no active session
      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: now,
        },
      });
    }),

  // Update task
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      priority: z.number().min(1).max(5).optional(),
      spiciness: z.number().min(1).max(5).optional(),
      deadline: z.date().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.task.update({
        where: {
          id,
          userId: ctx.session.user.id,
        },
        data,
      });
    }),

  // Toggle subtask
  toggleSubtask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      subtaskId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify task ownership
      const task = await ctx.db.task.findUnique({
        where: {
          id: input.taskId,
          userId: ctx.session.user.id,
        },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const subtask = await ctx.db.subtask.findUnique({
        where: { id: input.subtaskId },
      });

      if (!subtask) {
        throw new Error("Subtask not found");
      }

      return ctx.db.subtask.update({
        where: { id: input.subtaskId },
        data: {
          completed: !subtask.completed,
        },
      });
    }),

  // Delete task permanently
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Restore task to inbox
  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      const needsReset = user?.lastResetDate ? needsDailyReset(user.lastResetDate) : true;
      if (needsReset) {
        await performDailyReset(ctx.db, ctx.session.user.id);
      }

      return ctx.db.task.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: TaskStatus.INBOX,
          completedAt: null,
          lastStartedAt: null,
          totalTimeSpent: 0,
        },
      });
    }),

  // Manual daily reset (can be called by cron job)
  performDailyReset: protectedProcedure
    .mutation(async ({ ctx }) => {
      await performDailyReset(ctx, ctx.session.user.id);
      return { success: true };
    }),
    
  // Reset all users (for cron job - requires special handling)
  resetAllUsers: protectedProcedure
    .mutation(async ({ ctx }) => {
      // In production, you'd want to add additional auth check here
      // to ensure only cron jobs can call this
      
      const users = await ctx.db.user.findMany({
        select: { id: true, lastResetDate: true },
      });
      
      const resetPromises = users
        .filter(user => needsDailyReset(user.lastResetDate))
        .map(user => performDailyReset(ctx, user.id));
      
      await Promise.all(resetPromises);
      
      return { 
        success: true, 
        usersReset: resetPromises.length 
      };
    }),
});