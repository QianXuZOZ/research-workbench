import { describe, expect, it } from "vitest";
import { calendarDateInTimeZone, clamp, normalizeDoi, normalizeTitle, safeFilename } from "@/lib/utils";

describe("shared data helpers", () => {
  it("normalizes DOI and titles", () => {
    expect(normalizeDoi("https://doi.org/10.1109/TPWRS.2026.1")).toBe("10.1109/tpwrs.2026.1");
    expect(normalizeTitle("电力系统：保护 协调！")).toBe("电力系统保护协调");
  });

  it("sanitizes uploaded filenames", () => {
    expect(safeFilename("../报告:最终版?.pdf")).toBe(".._报告_最终版_.pdf");
    expect(safeFilename("CON<>.docx")).toBe("CON__.docx");
  });

  it("clamps ratios", () => {
    expect(clamp(1.4, 0, 1)).toBe(1);
    expect(clamp(-0.2, 0, 1)).toBe(0);
  });
  it("converts calendar dates using the configured research timezone", () => {
    const instant = new Date("2026-09-23T16:30:00.000Z");
    expect(calendarDateInTimeZone(instant, "Asia/Hong_Kong")).toBe("2026-09-24");
    expect(calendarDateInTimeZone(instant, "UTC")).toBe("2026-09-23");
  });

});
