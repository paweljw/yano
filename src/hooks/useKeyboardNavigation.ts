import { useEffect, useState, useCallback } from "react";
import type { Task as PrismaTask, Subtask } from "@prisma/client";

type Task = PrismaTask & { subtasks: Subtask[] };

interface KeyboardNavigationOptions {
  tasks: Task[];
  onAccept?: (task: Task) => void;
  onReject?: (task: Task) => void;
  onPostpone?: (task: Task) => void;
  onStart?: (task: Task) => void;
  onPause?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  tasks,
  onAccept,
  onReject,
  onPostpone,
  onStart,
  onPause,
  onComplete,
  onEdit,
  enabled = true,
}: KeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when tasks change
  useEffect(() => {
    if (tasks && selectedIndex >= tasks.length) {
      setSelectedIndex(Math.max(0, tasks.length - 1));
    }
  }, [tasks, selectedIndex]);

  const moveSelectionUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const moveSelectionDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, (tasks?.length ?? 1) - 1));
  }, [tasks?.length]);

  const handleAction = useCallback(
    (action: (task: Task) => void) => {
      if (!tasks || tasks.length === 0) return;
      const selectedTask = tasks[selectedIndex];
      if (selectedTask) {
        action(selectedTask);
        // Adjust selection if at the end of list
        if (selectedIndex === tasks.length - 1 && selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      }
    },
    [tasks, selectedIndex],
  );

  useEffect(() => {
    if (!enabled || !tasks || tasks.length === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const selectedTask = tasks[selectedIndex];

      switch (key) {
        case "j":
          e.preventDefault();
          moveSelectionDown();
          break;

        case "k":
          e.preventDefault();
          moveSelectionUp();
          break;

        case "y":
          e.preventDefault();
          if (onAccept && selectedTask) {
            handleAction(onAccept);
          } else if (onStart && selectedTask) {
            handleAction(onStart);
          }
          break;

        case "n":
          if (!e.metaKey && !e.ctrlKey && onReject) {
            e.preventDefault();
            handleAction(onReject);
          }
          break;

        case "p":
          e.preventDefault();
          if (onPostpone && selectedTask) {
            handleAction(onPostpone);
          } else if (onPause && selectedTask) {
            handleAction(onPause);
          }
          break;

        case "d":
          if (onComplete) {
            e.preventDefault();
            handleAction(onComplete);
          }
          break;

        case "e":
          if (onEdit) {
            e.preventDefault();
            handleAction(onEdit);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    enabled,
    tasks,
    selectedIndex,
    onAccept,
    onReject,
    onPostpone,
    onStart,
    onPause,
    onComplete,
    onEdit,
    handleAction,
    moveSelectionUp,
    moveSelectionDown,
  ]);

  return {
    selectedIndex,
    setSelectedIndex,
    selectedTask: tasks?.[selectedIndex] ?? null,
  };
}
