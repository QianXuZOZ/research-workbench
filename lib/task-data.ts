import { sqlite } from "@/lib/db";

export type TaskItem = Record<string, unknown> & { id: string; title: string; status: string; priority: string };

export function listTaskItems(options: { status?: string | null; from?: string | null; to?: string | null } = {}) {
  const where = ["archived_at IS NULL"];
  const values: unknown[] = [];
  if (options.status) { where.push("status = ?"); values.push(options.status); }
  if (options.from) { where.push("due_at >= ?"); values.push(options.from); }
  if (options.to) { where.push("due_at <= ?"); values.push(options.to); }
  return sqlite.prepare(`SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, due_at IS NULL, due_at`)
    .all(...values) as TaskItem[];
}
