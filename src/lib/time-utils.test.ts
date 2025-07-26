import { describe, it, expect } from 'vitest';

// Test the time formatting logic from TaskCard
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

describe('Time Formatting', () => {
  it('should format seconds correctly', () => {
    expect(formatTime(0)).toBe('0m');
    expect(formatTime(30)).toBe('0m');
    expect(formatTime(60)).toBe('1m');
    expect(formatTime(90)).toBe('1m');
    expect(formatTime(120)).toBe('2m');
    expect(formatTime(3600)).toBe('1h 0m');
    expect(formatTime(3660)).toBe('1h 1m');
    expect(formatTime(7200)).toBe('2h 0m');
    expect(formatTime(5400)).toBe('1h 30m');
  });
});