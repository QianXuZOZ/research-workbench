import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const patchSchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  metricType: z.enum(["count", "number", "boolean", "score"]).optional(),
  sourceType: z.enum(["manual", "projects", "papers", "patents", "growth"]).optional(),
  sourceFilter: z.record(z.string(), z.unknown()).nullable().optional(),
  targetValue: z.coerce.number().min(0).optional(),
  manualValue: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  required: z.boolean().optional(),
  evidenceNotes: z.string().max(5000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "没有可更新的内容");

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查指标内容", 400, "VALIDATION_ERROR");
  const existing = sqlite.prepare("SELECT id FROM promotion_metrics WHERE id = ?").get(id);
  if (!existing) return jsonError("指标不存在", 404, "NOT_FOUND");
  const allowed: Record<string, string> = { category: "category", name: "name", metricType: "metric_type", sourceType: "source_type", sourceFilter: "source_filter", targetValue: "target_value", manualValue: "manual_value", weight: "weight", required: "required", evidenceNotes: "evidence_notes" };
  const entries = Object.entries(parsed.data);
  const values = entries.map(([key, value]) => key === "sourceFilter" ? (value == null ? null : JSON.stringify(value)) : key === "required" ? (value ? 1 : 0) : value);
  sqlite.prepare(`UPDATE promotion_metrics SET ${entries.map(([key]) => `${allowed[key]} = ?`).join(",")}, updated_at = ? WHERE id = ?`).run(...values, nowIso(), id);
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const { id } = await context.params; sqlite.prepare("DELETE FROM promotion_metrics WHERE id = ?").run(id); return Response.json({ ok: true });
}
