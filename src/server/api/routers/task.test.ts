import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskRouter } from './task';
import { createTRPCMsw } from 'msw-trpc';
import type { AppRouter } from '../root';
import { TaskStatus } from '@prisma/client';

// Mock the database
vi.mock('~/server/db', () => ({
  db: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subtask: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    timeSession: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('taskRouter', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockContext = {
    session: mockSession,
    db: {
      task: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
      },
      subtask: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      timeSession: {
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInbox', () => {
    it('should return inbox tasks that are not postponed', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test Task 1',
          status: TaskStatus.INBOX,
          userId: 'test-user-id',
          postponedUntil: null,
          subtasks: [],
        },
        {
          id: '2',
          title: 'Test Task 2',
          status: TaskStatus.INBOX,
          userId: 'test-user-id',
          postponedUntil: new Date('2020-01-01'), // Past date
          subtasks: [],
        },
      ];

      mockContext.db.task.findMany.mockResolvedValue(mockTasks);

      const caller = taskRouter.createCaller(mockContext as any);
      const result = await caller.getInbox();

      expect(result).toEqual(mockTasks);
      expect(mockContext.db.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-id',
          status: TaskStatus.INBOX,
          OR: [
            { postponedUntil: null },
            { postponedUntil: { lte: expect.any(Date) } },
          ],
        },
        include: {
          subtasks: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { deadline: 'asc' },
          { createdAt: 'asc' },
        ],
      });
    });
  });

  describe('create', () => {
    it('should create a new task with subtasks', async () => {
      const input = {
        title: 'New Task',
        description: 'Task description',
        priority: 4,
        spiciness: 2,
        subtasks: ['Subtask 1', 'Subtask 2'],
      };

      const mockCreatedTask = {
        id: 'new-task-id',
        ...input,
        userId: 'test-user-id',
        status: TaskStatus.INBOX,
        subtasks: [
          { id: 'sub1', title: 'Subtask 1', order: 0 },
          { id: 'sub2', title: 'Subtask 2', order: 1 },
        ],
      };

      mockContext.db.task.create.mockResolvedValue(mockCreatedTask);

      const caller = taskRouter.createCaller(mockContext as any);
      const result = await caller.create(input);

      expect(result).toEqual(mockCreatedTask);
      expect(mockContext.db.task.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          spiciness: input.spiciness,
          userId: 'test-user-id',
          subtasks: {
            create: [
              { title: 'Subtask 1', order: 0 },
              { title: 'Subtask 2', order: 1 },
            ],
          },
        },
        include: {
          subtasks: true,
        },
      });
    });
  });

  describe('accept', () => {
    it('should move task to TODAY status', async () => {
      const taskId = 'task-123';
      const mockUpdatedTask = {
        id: taskId,
        status: TaskStatus.TODAY,
        acceptedAt: new Date(),
      };

      mockContext.db.task.update.mockResolvedValue(mockUpdatedTask);

      const caller = taskRouter.createCaller(mockContext as any);
      const result = await caller.accept({ id: taskId });

      expect(result).toEqual(mockUpdatedTask);
      expect(mockContext.db.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
          userId: 'test-user-id',
        },
        data: {
          status: TaskStatus.TODAY,
          acceptedAt: expect.any(Date),
        },
      });
    });
  });

  describe('start', () => {
    it('should start a task and create a time session', async () => {
      const taskId = 'task-123';
      const now = new Date();
      
      const mockUpdatedTask = {
        id: taskId,
        status: TaskStatus.IN_PROGRESS,
        lastStartedAt: now,
      };

      mockContext.db.task.update.mockResolvedValue(mockUpdatedTask);
      mockContext.db.timeSession.create.mockResolvedValue({
        id: 'session-1',
        taskId,
        startedAt: now,
      });

      const caller = taskRouter.createCaller(mockContext as any);
      const result = await caller.start({ id: taskId });

      expect(result).toEqual(mockUpdatedTask);
      expect(mockContext.db.timeSession.create).toHaveBeenCalledWith({
        data: {
          taskId,
          startedAt: expect.any(Date),
        },
      });
      expect(mockContext.db.task.update).toHaveBeenCalledWith({
        where: {
          id: taskId,
          userId: 'test-user-id',
        },
        data: {
          status: TaskStatus.IN_PROGRESS,
          lastStartedAt: expect.any(Date),
        },
      });
    });
  });
});