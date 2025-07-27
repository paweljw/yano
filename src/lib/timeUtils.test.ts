import { describe, it, expect } from "vitest";
import { formatTime } from "./timeUtils";

describe("Time Formatting", () => {
  it("should format seconds correctly", () => {
    expect(formatTime(0)).toBe("0m");
    expect(formatTime(30)).toBe("0m");
    expect(formatTime(60)).toBe("1m");
    expect(formatTime(90)).toBe("1m");
    expect(formatTime(120)).toBe("2m");
    expect(formatTime(3600)).toBe("1h 0m");
    expect(formatTime(3660)).toBe("1h 1m");
    expect(formatTime(7200)).toBe("2h 0m");
    expect(formatTime(5400)).toBe("1h 30m");
  });
});
