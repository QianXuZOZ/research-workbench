import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { getPromotionOverview } from "@/lib/promotion";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const weekEnd = new Date(now.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const year = now.getUTCFullYear();
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
    papers: (sqlite.prepare("SELECT COUNT(*) count FROM papers WHERE archived_at IS NULL AND COALESCE(year, CAST(substr(published_at,1,4) AS INTEGER)) = ?").get(year) as { count: number }).count,
    patents: (sqlite.prepare("SELECT COUNT(*) count FROM patents WHERE archived_at IS NULL AND substr(COALESCE(granted_at, filed_at),1,4) = ?").get(String(year)) as { count: number }).count,
    completedProjects: (sqlite.prepare("SELECT COUNT(*) count FROM projects WHERE archived_at IS NULL AND status='completed' AND substr(updated_at,1,4) = ?").get(String(year)) as { count: number }).count,
  };
  const riskyProjects = sqlite.prepare("SELECT id,title,risk,progress,end_date FROM projects WHERE archived_at IS NULL AND status IN ('planning','active','paused') AND (risk != 'normal' OR (end_date IS NOT NULL AND end_date <= ?)) ORDER BY CASE risk WHEN 'high' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END, end_date LIMIT 5").all(weekEnd);
  const activity = sqlite.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8").all();
  const promotion = getPromotionOverview()[0] ?? null;
  return Response.json({ today, weekEnd, taskCounts, upcoming, projectStats, paperStats, patentStats, outputs, riskyProjects, activity, promotion });
}
