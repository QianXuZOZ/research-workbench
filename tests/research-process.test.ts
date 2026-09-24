import { describe, expect, it } from "vitest";
import { isRecordType, recordSchemas, recordTables } from "@/lib/records";

describe("research process record model", () => {
  it("registers all research process record types", () => {
    for (const type of ["questions", "hypotheses", "experiments", "runs", "findings", "artifacts"]) {
      expect(isRecordType(type)).toBe(true);
      expect(recordTables[type as keyof typeof recordTables]).toBeTruthy();
    }
  });

  it("validates representative experiment, finding, and artifact records", () => {
    expect(recordSchemas.experiments.safeParse({ title: "DSOGI 降阶验证", platform: "PSCAD", status: "planned" }).success).toBe(true);
    expect(recordSchemas.findings.safeParse({ title: "符号方向发现", claim: "两模型存在整体符号反向", confidence: 90 }).success).toBe(true);
    expect(recordSchemas.artifacts.safeParse({ title: "run_dsogi_match.m", artifactType: "matlab", storageType: "local_path", location: "D:/research/run_dsogi_match.m" }).success).toBe(true);
  });
});
