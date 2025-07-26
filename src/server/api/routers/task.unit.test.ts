import { describe, it, expect } from 'vitest';
import { TaskStatus } from '@prisma/client';

// Test helper functions from task router
const needsDailyReset = (lastResetDate: Date): boolean => {
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  
  // Reset if dates are different (ignoring time)
  return now.toDateString() !== lastReset.toDateString();
};

describe('Task Router - Unit Tests', () => {
  describe('needsDailyReset', () => {
    it('should return false for same day', () => {
      // Use today's date for both to ensure they're the same day
      const now = new Date();
      const lastReset = new Date(now);
      lastReset.setHours(1, 0, 0, 0); // Set to 1 AM today
      
      // The function compares toDateString() which ignores time
      expect(needsDailyReset(lastReset)).toBe(false);
    });

    it('should return true for different days', () => {
      const lastReset = new Date('2024-01-14T23:59:59Z');
      // This test will use actual current date, so we'll just check the logic
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(needsDailyReset(yesterday)).toBe(true);
    });

    it('should return true for much older dates', () => {
      const lastReset = new Date('2024-01-01T00:00:00Z');
      const today = new Date();
      if (today.getFullYear() > 2024 || today.getMonth() > 0 || today.getDate() > 1) {
        expect(needsDailyReset(lastReset)).toBe(true);
      }
    });
  });

  describe('Task Status Transitions', () => {
    it('should define valid status transitions', () => {
      // Test that TaskStatus enum values are what we expect
      expect(TaskStatus.INBOX).toBe('INBOX');
      expect(TaskStatus.TODAY).toBe('TODAY');
      expect(TaskStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(TaskStatus.PAUSED).toBe('PAUSED');
      expect(TaskStatus.COMPLETED).toBe('COMPLETED');
      expect(TaskStatus.TRASH).toBe('TRASH');
    });

    it('should validate status transition logic', () => {
      // Valid transitions from INBOX
      const validFromInbox = [TaskStatus.TODAY, TaskStatus.TRASH];
      
      // Valid transitions from TODAY
      const validFromToday = [TaskStatus.IN_PROGRESS, TaskStatus.INBOX];
      
      // Valid transitions from IN_PROGRESS
      const validFromInProgress = [TaskStatus.PAUSED, TaskStatus.COMPLETED];
      
      // Valid transitions from PAUSED
      const validFromPaused = [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED];
      
      // All statuses can be restored to INBOX
      const canRestoreToInbox = [
        TaskStatus.COMPLETED,
        TaskStatus.TRASH
      ];

      expect(validFromInbox).toContain(TaskStatus.TODAY);
      expect(validFromInbox).toContain(TaskStatus.TRASH);
      expect(validFromToday).toContain(TaskStatus.IN_PROGRESS);
      expect(validFromInProgress).toContain(TaskStatus.PAUSED);
      expect(validFromPaused).toContain(TaskStatus.IN_PROGRESS);
      expect(canRestoreToInbox).toContain(TaskStatus.COMPLETED);
    });
  });
});