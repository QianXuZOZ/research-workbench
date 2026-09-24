import { describe, expect, it } from "vitest";
import { modules } from "@/lib/module-config";

describe("research relation field configuration", () => {
  it("uses relation selectors instead of raw ids", () => {
    const expectations = [
      ["questions", "projectId", "projects"],
      ["hypotheses", "projectId", "projects"],
      ["hypotheses", "questionId", "questions"],
      ["experiments", "projectId", "projects"],
      ["experiments", "hypothesisId", "hypotheses"],
      ["runs", "experimentId", "experiments"],
      ["findings", "projectId", "projects"],
      ["findings", "experimentId", "experiments"],
      ["findings", "runId", "runs"],
      ["artifacts", "projectId", "projects"],
      ["artifacts", "experimentId", "experiments"],
      ["artifacts", "runId", "runs"],
    ] as const;

    for (const [moduleKey, fieldKey, relationType] of expectations) {
      const field = modules[moduleKey].fields.find((item) => item.key === fieldKey);
      expect(field?.relation?.type).toBe(relationType);
    }
  });

  it("declares cascading dependencies for nested research relations", () => {
    expect(modules.hypotheses.fields.find((field) => field.key === "questionId")?.relation?.dependsOn)
      .toEqual({ formKey: "projectId", targetKey: "projectId" });
    expect(modules.findings.fields.find((field) => field.key === "runId")?.relation?.dependsOn)
      .toEqual({ formKey: "experimentId", targetKey: "experimentId" });
  });
});
