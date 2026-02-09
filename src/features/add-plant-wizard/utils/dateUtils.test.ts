import { describe, expect, it } from "vitest";
import { formatYmd, getKstTodayYmd, toKstMidnight, toKstNoon } from "./dateUtils";

describe("add-plant-wizard/dateUtils (KST)", () => {
  it("formatYmd should format by KST calendar date", () => {
    // 2026-02-08T15:00:00Z == 2026-02-09 00:00 KST
    const d = new Date(Date.UTC(2026, 1, 8, 15, 0, 0, 0));
    expect(formatYmd(d)).toBe("2026-02-09");
  });

  it("toKstMidnight should return epoch for 00:00 KST", () => {
    // Any time within the KST date should map to the same midnight base.
    const d = new Date(Date.UTC(2026, 1, 9, 0, 0, 0, 0));
    const expected = Date.UTC(2026, 1, 8, 15, 0, 0, 0);
    expect(toKstMidnight(d)).toBe(expected);
  });

  it("toKstNoon should return epoch for 12:00 KST", () => {
    const d = new Date(Date.UTC(2026, 1, 9, 0, 0, 0, 0));
    const expected = Date.UTC(2026, 1, 9, 3, 0, 0, 0);
    expect(toKstNoon(d)).toBe(expected);
  });

  it("getKstTodayYmd should use provided nowMs", () => {
    const nowMs = Date.UTC(2026, 1, 8, 15, 0, 0, 0); // 2026-02-09 00:00 KST
    expect(getKstTodayYmd(nowMs)).toBe("2026-02-09");
  });
});
