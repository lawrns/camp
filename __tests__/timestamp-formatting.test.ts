import { formatRelativeTimeShort } from "@/lib/utils/date";

describe("Timestamp Formatting", () => {
  const now = new Date();
  
  test("should format recent times correctly", () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTimeShort(fiveMinutesAgo)).toBe("5m");
    
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTimeShort(twoHoursAgo)).toBe("2h");
    
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTimeShort(threeDaysAgo)).toBe("3d");
  });

  test("should handle very recent times", () => {
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    expect(formatRelativeTimeShort(thirtySecondsAgo)).toBe("just now");
    
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    expect(formatRelativeTimeShort(oneMinuteAgo)).toBe("1m");
  });

  test("should handle longer periods", () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTimeShort(twoWeeksAgo)).toBe("2w");
    
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTimeShort(threeMonthsAgo)).toBe("2mo");
    
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTimeShort(oneYearAgo)).toBe("1y");
  });

  test("should handle invalid dates", () => {
    expect(formatRelativeTimeShort(new Date("invalid"))).toBe("");
    expect(formatRelativeTimeShort("invalid-date")).toBe("");
  });

  test("should handle string dates", () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTimeShort(fiveMinutesAgo.toISOString())).toBe("5m");
  });
}); 