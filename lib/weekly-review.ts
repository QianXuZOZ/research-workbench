import { z } from "zod";
import { sqlite } from "@/lib/db";
import { nowIso } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

export const weeklyReviewInputSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reflection: z.string().max(10000).nullable().optional(),
  nextFocus: z.string().max(10000).nullable().optional(),
});
export type WeeklyReviewInput = z.infer<typeof weeklyReviewInputSchema>;

export function saveWeeklyReview(raw: WeeklyReviewInput, actor: "web" | "mcp" = "web") {
  const data = weeklyReviewInputSchema.parse(raw);
  const now = nowIso();
  const existing = sqlite.prepare("SELECT * FROM weekly_reviews WHERE period_start=?").get(data.periodStart) as Record<string,unknown> | undefined;

  if (existing) {
    const reflection = data.reflection === undefined ? (existing.reflection ?? null) : (data.reflection || null);
    const nextFocus = data.nextFocus === undefined ? (existing.next_focus ?? null) : (data.nextFocus || null);
    sqlite.prepare("UPDATE weekly_reviews SET period_end=?,reflection=?,next_focus=?,updated_at=? WHERE id=?")
      .run(data.periodEnd, reflection, nextFocus, now, String(existing.id));
    logActivity("update", `${actor === "mcp" ? "MCP " : ""}更新周复盘：${data.periodStart}`, "reviews", existing.id);
    return sqlite.prepare("SELECT * FROM weekly_reviews WHERE id=?").get(String(existing.id)) as Record<string,unknown>;
  }

  const id = crypto.randomUUID();
  sqlite.prepare("INSERT INTO weekly_reviews (id,period_start,period_end,reflection,next_focus,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, data.periodStart, data.periodEnd, data.reflection || null, data.nextFocus || null, now, now);
  logActivity("create", `${actor === "mcp" ? "MCP " : ""}创建周复盘：${data.periodStart}`, "reviews", id);
  return sqlite.prepare("SELECT * FROM weekly_reviews WHERE id=?").get(id) as Record<string,unknown>;
}
