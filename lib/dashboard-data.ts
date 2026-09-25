import { sqlite } from "@/lib/db";
import { getPromotionOverview } from "@/lib/promotion";
import { calendarDateInTimeZone } from "@/lib/utils";

export type DashboardData = {
  today: string;
  weekEnd: string;
  timezone: string;
  taskCounts: { overdue: number | null; due_week: number | null; done: number | null; total: number };
  upcoming: Record<string, unknown>[];
  projectStats: { status: string; count: number }[];
  paperStats: { status: string; count: number }[];
  patentStats: { status: string; count: number }[];
  outputs: { papers: number; patents: number; completedProjects: number };
  riskyProjects: Record<string, unknown>[];
  activity: Record<string, unknown>[];
  promotion: null | { title: string; progress: number; requiredGaps: number; metrics: Record<string, unknown>[] };
};

function configuredTimezone() {
  return (sqlite.prepare("SELECT value FROM settings WHERE key='timezone'").get() as { value: string } | undefined)?.value
    ?? process.env.APP_TIMEZONE
    ?? "Asia/Hong_Kong";
}

export function getDashboardData(timezone = configuredTimezone()): DashboardData {
  const now = new Date();
  const today = calendarDateInTimeZone(now, timezone);
  const weekEnd = calendarDateInTimeZone(new Date(now.getTime() + 7 * 86400_000), timezone);
  const year = Number(today.slice(0, 4));

  const taskCounts = sqlite.prepare(`SELECT
    SUM(CASE WHEN status != 'done' AND due_at < ? THEN 1 ELSE 0 END) overdue,
    SUM(CASE WHEN status != 'done' AND due_at >= ? AND due_at <= ? THEN 1 ELSE 0 END) due_week,
    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) done,
    COUNT(*) total FROM tasks WHERE archived_at IS NULL`).get(today, today, weekEnd) as DashboardData["taskCounts"];

  const upcoming = sqlite.prepare("SELECT * FROM tasks WHERE archived_at IS NULL AND status != 'done' AND due_at IS NOT NULL AND due_at <= ? ORDER BY due_at, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END LIMIT 8").all(weekEnd) as Record<string, unknown>[];
  const projectStats = sqlite.prepare("SELECT status, COUNT(*) count FROM projects WHERE archived_at IS NULL GROUP BY status").all() as DashboardData["projectStats"];
  const paperStats = sqlite.prepare("SELECT status, COUNT(*) count FROM papers WHERE archived_at IS NULL GROUP BY status").all() as DashboardData["paperStats"];
  const patentStats = sqlite.prepare("SELECT status, COUNT(*) count FROM patents WHERE archived_at IS NULL GROUP BY status").all() as DashboardData["patentStats"];
  const outputs = {
    papers: (sqlite.prepare("SELECT COUNT(*) count FROM papers WHERE archived_at IS NULL AND ((published_at IS NOT NULL AND substr(published_at,1,4) = ?) OR (published_at IS NULL AND status='published' AND year = ?))").get(String(year), year) as { count: number }).count,
    patents: (sqlite.prepare("SELECT COUNT(*) count FROM patents WHERE archived_at IS NULL AND granted_at IS NOT NULL AND substr(granted_at,1,4) = ?").get(String(year)) as { count: number }).count,
    completedProjects: (sqlite.prepare("SELECT COUNT(*) count FROM projects WHERE archived_at IS NULL AND completed_at IS NOT NULL AND substr(completed_at,1,4) = ?").get(String(year)) as { count: number }).count,
  };
  const riskyProjects = sqlite.prepare("SELECT id,title,risk,progress,end_date FROM projects WHERE archived_at IS NULL AND status IN ('planning','active','paused') AND (risk != 'normal' OR (end_date IS NOT NULL AND end_date <= ?)) ORDER BY CASE risk WHEN 'high' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END, end_date LIMIT 5").all(weekEnd) as Record<string, unknown>[];
  const activity = sqlite.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 8").all() as Record<string, unknown>[];
  const promotion = (getPromotionOverview()[0] ?? null) as DashboardData["promotion"];

  return { today, weekEnd, timezone, taskCounts, upcoming, projectStats, paperStats, patentStats, outputs, riskyProjects, activity, promotion };
}
