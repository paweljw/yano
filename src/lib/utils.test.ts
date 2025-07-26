import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should combine class names', () => {
    const result = cn('base-class', 'additional-class');
    expect(result).toBe('base-class additional-class');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', {
      'active': true,
      'inactive': false,
    });
    expect(result).toBe('base active');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['base', 'array'], 'additional');
    expect(result).toBe('base array additional');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('should handle empty strings', () => {
    const result = cn('base', '', 'end');
    expect(result).toBe('base end');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4 text-red-500', 'p-2 text-blue-500');
    expect(result).toBe('p-2 text-blue-500');
  });

  it('should handle complex tailwind class merging', () => {
    const result = cn(
      'bg-zinc-900 hover:bg-zinc-800',
      'bg-purple-500 hover:bg-purple-600'
    );
    expect(result).toBe('bg-purple-500 hover:bg-purple-600');
  });
});