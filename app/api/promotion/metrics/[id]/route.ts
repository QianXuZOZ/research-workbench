import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const { id } = await context.params; const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return jsonError("请求内容无效");
  const allowed: Record<string, string> = { category: "category", name: "name", metricType: "metric_type", sourceType: "source_type", sourceFilter: "source_filter", targetValue: "target_value", manualValue: "manual_value", weight: "weight", required: "required", evidenceNotes: "evidence_notes" };
  const entries = Object.entries(body).filter(([key]) => allowed[key]);
  if (!entries.length) return jsonError("没有可更新的内容");
  const values = entries.map(([key, value]) => key === "sourceFilter" ? JSON.stringify(value) : key === "required" ? (value ? 1 : 0) : value);
  sqlite.prepare(`UPDATE promotion_metrics SET ${entries.map(([key]) => `${allowed[key]} = ?`).join(",")}, updated_at = ? WHERE id = ?`).run(...values, nowIso(), id);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const { id } = await context.params; sqlite.prepare("DELETE FROM promotion_metrics WHERE id = ?").run(id); return Response.json({ ok: true });
}
