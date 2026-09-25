import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { updateSearchIndex } from "@/lib/search";
import { taskSchema } from "@/lib/tasks";
import { listTaskItems } from "@/lib/task-data";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const params = request.nextUrl.searchParams;
  const items = listTaskItems({
    status: params.get("status"),
    from: params.get("from"),
    to: params.get("to"),
  });
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
