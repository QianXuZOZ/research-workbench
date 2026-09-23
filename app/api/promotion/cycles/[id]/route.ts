import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return jsonError("请求内容无效");
  const allowed: Record<string, string> = { title: "title", targetRole: "target_role", status: "status", startsAt: "starts_at", dueAt: "due_at", notes: "notes" };
  const entries = Object.entries(body).filter(([key]) => allowed[key]);
  if (!entries.length) return jsonError("没有可更新的内容");
  sqlite.prepare(`UPDATE promotion_cycles SET ${entries.map(([key]) => `${allowed[key]} = ?`).join(",")}, updated_at = ? WHERE id = ?`).run(...entries.map(([, value]) => value || null), nowIso(), id);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  sqlite.prepare("UPDATE promotion_cycles SET archived_at = ?, updated_at = ? WHERE id = ?").run(nowIso(), nowIso(), id);
  return Response.json({ ok: true });
}
