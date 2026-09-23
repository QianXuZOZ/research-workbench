import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { updateSearchIndex } from "@/lib/search";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "请输入任务名称").max(300),
  kind: z.enum(["task", "milestone"]).default("task"),
  status: z.enum(["todo", "doing", "done", "blocked"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueAt: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  entityType: z.string().max(30).nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");
  const where = ["archived_at IS NULL"];
  const values: unknown[] = [];
  if (status) { where.push("status = ?"); values.push(status); }
  if (from) { where.push("due_at >= ?"); values.push(from); }
  if (to) { where.push("due_at <= ?"); values.push(to); }
  const items = sqlite.prepare(`SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, due_at IS NULL, due_at`).all(...values);
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const parsed = taskSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查任务内容", 400, "VALIDATION_ERROR", Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
  const data = parsed.data;
  const id = crypto.randomUUID();
  const now = nowIso();
  const completedAt = data.status === "done" ? now : null;
  sqlite.prepare(`INSERT INTO tasks (id,title,kind,status,priority,due_at,start_at,completed_at,progress,entity_type,entity_id,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, data.title, data.kind, data.status, data.priority, data.dueAt || null, data.startAt || null, completedAt, data.status === "done" ? 100 : data.progress, data.entityType || null, data.entityId || null, data.notes || null, now, now);
  updateSearchIndex("tasks", id, data.title, data.notes ?? "");
  logActivity("create", `新建${data.kind === "milestone" ? "里程碑" : "任务"}：${data.title}`, "tasks", id);
  return Response.json({ item: sqlite.prepare("SELECT * FROM tasks WHERE id = ?").get(id) }, { status: 201 });
}
