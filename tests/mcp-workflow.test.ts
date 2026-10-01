import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-workbench-mcp-v3-"));
process.env.DATABASE_PATH = path.join(tempDir, "workbench.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");
process.env.MCP_ACCESS_TOKEN = "m".repeat(48);

describe("MCP v3 workflow services", () => {
  beforeAll(() => fs.mkdirSync(process.env.UPLOAD_DIR!, { recursive: true }));
  afterAll(async () => {
    const { sqlite } = await import("../lib/db");
    sqlite.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("captures and processes Inbox items through shared workflow logic", async () => {
    const [{ sqlite }, { createQuickCapture }, { processInboxItem }, { searchWorkspace }] = await Promise.all([
      import("../lib/db"),
      import("../lib/quick-capture"),
      import("../lib/inbox-workflow"),
      import("../lib/workspace-search"),
    ]);

    const captured = createQuickCapture({ type: "inbox", title: "PLL 暂态稳定性问题", notes: "需要验证频偏较大工况", url: "https://example.test/pll" });
    const inbox = sqlite.prepare("SELECT * FROM inbox_items WHERE id=?").get(captured.id) as Record<string, unknown>;
    expect(inbox.status).toBe("inbox");

    const processed = processInboxItem(captured.id, "question", "mcp");
    expect(processed.targetType).toBe("question");
    expect((sqlite.prepare("SELECT status FROM inbox_items WHERE id=?").get(captured.id) as { status: string }).status).toBe("processed");

    const question = sqlite.prepare("SELECT * FROM research_questions WHERE id=?").get(processed.targetId) as Record<string, unknown>;
    expect(question.title).toBe("PLL 暂态稳定性问题");
    expect(String(question.context)).toContain("https://example.test/pll");

    const results = searchWorkspace("PLL", 20);
    expect(results.some((item) => item.entityType === "questions" && item.entityId === processed.targetId)).toBe(true);
    expect(results.some((item) => item.entityType === "inbox" && item.entityId === captured.id)).toBe(true);
  });

  it("saves the current weekly review and exposes it in review data/search", async () => {
    const [{ getWeeklyReviewData }, { saveWeeklyReview }, { searchWorkspace }] = await Promise.all([
      import("../lib/workflow-data"),
      import("../lib/weekly-review"),
      import("../lib/workspace-search"),
    ]);
    const current = getWeeklyReviewData();
    const saved = saveWeeklyReview({
      periodStart: current.start,
      periodEnd: current.end,
      reflection: "本周完成 DSOGI 模型验证",
      nextFocus: "下周补充 HIL 工况",
    }, "mcp");
    expect(saved.period_start).toBe(current.start);

    const refreshed = getWeeklyReviewData();
    expect(refreshed.review?.reflection).toBe("本周完成 DSOGI 模型验证");
    expect(searchWorkspace("DSOGI", 20).some((item) => item.entityType === "reviews")).toBe(true);
  });

  it("returns a project-centered research context", async () => {
    const [{ sqlite }, { getResearchContext }] = await Promise.all([
      import("../lib/db"),
      import("../lib/research-context"),
    ]);
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();
    const questionId = crypto.randomUUID();
    sqlite.prepare("INSERT INTO projects (id,title,status,progress,risk,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .run(projectId, "新能源保护研究", "active", 20, "normal", now, now);
    sqlite.prepare("INSERT INTO research_questions (id,title,project_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?)")
      .run(questionId, "控制如何影响保护？", projectId, "open", now, now);

    const context = getResearchContext(projectId);
    expect(context.project.id).toBe(projectId);
    expect(context.summary.questions).toBe(1);
    expect(context.questions[0].id).toBe(questionId);
  });
});
