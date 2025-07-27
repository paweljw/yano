"use client";

import { useState, useEffect } from "react";

interface TaskTimerProps {
  isRunning: boolean;
  currentSessionStart?: Date | null;
  totalTimeSpent: number;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
}

export function TaskTimer({
  isRunning,
  currentSessionStart,
  totalTimeSpent,
  onStart,
  onPause,
  onComplete,
}: TaskTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning || !currentSessionStart) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const sessionTime = Math.floor(
        (now.getTime() - currentSessionStart.getTime()) / 1000,
      );
      setElapsedTime(sessionTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentSessionStart]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const currentTotal = totalTimeSpent + elapsedTime;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="text-right">
        <div className="font-mono text-2xl font-bold text-white">
          {formatTime(elapsedTime)}
        </div>
        {currentTotal > 0 && (
          <div className="text-xs text-zinc-500">
            Total: {formatTime(currentTotal)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isRunning ? (
          <>
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-lg bg-green-600/20 px-3 py-1.5 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              ya
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              done
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-2 rounded-lg bg-amber-600/20 px-3 py-1.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-600/30"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              pause
            </button>
            <button
              onClick={onComplete}
              className="flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-1.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-600/30"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
