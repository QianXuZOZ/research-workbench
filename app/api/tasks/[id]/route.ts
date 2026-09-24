import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { taskSchema } from "@/lib/tasks";
import { logActivity } from "@/lib/activity";
import { requireApiSession } from "@/lib/security";
import { deleteSearchIndex, updateSearchIndex } from "@/lib/search";
import { jsonError, nowIso } from "@/lib/utils";
import { saveRevision } from "@/lib/revisions";

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), value]));
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const current = sqlite.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!current) return jsonError("任务不存在", 404, "NOT_FOUND");
  const body = await request.json().catch(() => null);
  const parsed = taskSchema.safeParse({ ...camel(current), ...(body ?? {}) });
  if (!parsed.success) return jsonError("请检查任务内容", 400, "VALIDATION_ERROR");
  const data = parsed.data;
  saveRevision("tasks", id, camel(current), "user");
  const completedAt = data.status === "done" ? String(current.completed_at ?? nowIso()) : null;
  sqlite.prepare(`UPDATE tasks SET title=?,kind=?,status=?,priority=?,due_at=?,start_at=?,completed_at=?,progress=?,entity_type=?,entity_id=?,notes=?,updated_at=? WHERE id=?`)
    .run(data.title, data.kind, data.status, data.priority, data.dueAt || null, data.startAt || null, completedAt, data.status === "done" ? 100 : data.progress, data.entityType || null, data.entityId || null, data.notes || null, nowIso(), id);
  updateSearchIndex("tasks", id, data.title, data.notes ?? "");
  logActivity("update", `更新任务：${data.title}`, "tasks", id);
  return Response.json({ item: sqlite.prepare("SELECT * FROM tasks WHERE id = ?").get(id) });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const row = sqlite.prepare("SELECT title FROM tasks WHERE id = ?").get(id) as { title: string } | undefined;
  if (!row) return jsonError("任务不存在", 404, "NOT_FOUND");
  sqlite.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  deleteSearchIndex("tasks", id);
  logActivity("delete", `删除任务：${row.title}`, "tasks", id);
  return Response.json({ ok: true });
}
