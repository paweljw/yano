import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from './task-card';
import { TaskStatus } from '@prisma/client';

describe('TaskCard - Basic Tests', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    priority: 3,
    spiciness: 2,
    deadline: null,
    status: TaskStatus.TODAY,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    lastStartedAt: null,
    totalTimeSpent: 0,
    postponedUntil: null,
    acceptedAt: null,
    trashedAt: null,
    subtasks: [],
  };

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should render task description', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should render priority bars', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const bars = container.querySelectorAll('.h-1.w-4');
    expect(bars).toHaveLength(5);
  });

  it('should render spiciness peppers', () => {
    const { container } = render(<TaskCard task={mockTask} />);
    const peppers = Array.from(container.querySelectorAll('.text-xs')).filter(
      el => el.textContent === '🌶️'
    );
    expect(peppers).toHaveLength(2); // spiciness is 2
  });

  it('should render with subtasks', () => {
    const taskWithSubtasks = {
      ...mockTask,
      subtasks: [
        { id: 'sub-1', title: 'Subtask 1', completed: false, taskId: 'task-1', order: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: 'sub-2', title: 'Subtask 2', completed: true, taskId: 'task-1', order: 1, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    
    render(<TaskCard task={taskWithSubtasks} />);
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
  });

  it('should show time spent when greater than 0', () => {
    const taskWithTime = {
      ...mockTask,
      totalTimeSpent: 3600, // 1 hour
    };
    
    render(<TaskCard task={taskWithTime} />);
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
  });

  it('should apply selected styling', () => {
    const { container } = render(<TaskCard task={mockTask} isSelected={true} />);
    const card = container.querySelector('.group');
    expect(card?.className).toContain('border-purple-500');
  });
});