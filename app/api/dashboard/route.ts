import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { getPromotionOverview } from "@/lib/promotion";
import { calendarDateInTimeZone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const now = new Date();
  const timezone = process.env.APP_TIMEZONE ?? "Asia/Hong_Kong";
  const today = calendarDateInTimeZone(now, timezone);
  const weekEnd = calendarDateInTimeZone(new Date(now.getTime() + 7 * 86400_000), timezone);
  const year = Number(today.slice(0, 4));
  const taskCounts = sqlite.prepare(`SELECT
    SUM(CASE WHEN status != 'done' AND due_at < ? THEN 1 ELSE 0 END) overdue,
    SUM(CASE WHEN status != 'done' AND due_at >= ? AND due_at <= ? THEN 1 ELSE 0 END) due_week,
    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) done,
    COUNT(*) total FROM tasks WHERE archived_at IS NULL`).get(today, today, weekEnd) as Record<string, number>;
  const upcoming = sqlite.prepare("SELECT * FROM tasks WHERE archived_at IS NULL AND status != 'done' AND due_at IS NOT NULL AND due_at <= ? ORDER BY due_at, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END LIMIT 8").all(weekEnd);
  const projectStats = sqlite.prepare("SELECT status, COUNT(*) count FROM projects WHERE archived_at IS NULL GROUP BY status").all();
  const paperStats = sqlite.prepare("SELECT status, COUNT(*) count FROM papers WHERE archived_at IS NULL GROUP BY status").all();
  const patentStats = sqlite.prepare("SELECT status, COUNT(*) count FROM patents WHERE archived_at IS NULL GROUP BY status").all();
  const outputs = {
    papers: (sqlite.prepare("SELECT COUNT(*) count FROM papers WHERE archived_at IS NULL AND ((published_at IS NOT NULL AND substr(published_at,1,4) = ?) OR (published_at IS NULL AND status='published' AND year = ?))").get(String(year), year) as { count: number }).count,
    patents: (sqlite.prepare("SELECT COUNT(*) count FROM patents WHERE archived_at IS NULL AND granted_at IS NOT NULL AND substr(granted_at,1,4) = ?").get(String(year)) as { count: number }).count,
    completedProjects: (sqlite.prepare("SELECT COUNT(*) count FROM projects WHERE archived_at IS NULL AND completed_at IS NOT NULL AND substr(completed_at,1,4) = ?").get(String(year)) as { count: number }).count,
  };
  const riskyProjects = sqlite.prepare("SELECT id,title,risk,progress,end_date FROM projects WHERE archived_at IS NULL AND status IN ('planning','active','paused') AND (risk != 'normal' OR (end_date IS NOT NULL AND end_date <= ?)) ORDER BY CASE risk WHEN 'high' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END, end_date LIMIT 5").all(weekEnd);
  const activity = sqlite.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8").all();
  const promotion = getPromotionOverview()[0] ?? null;
  return Response.json({ today, weekEnd, timezone, taskCounts, upcoming, projectStats, paperStats, patentStats, outputs, riskyProjects, activity, promotion });
}
