import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const schema = z.object({
  cycleId: z.string().uuid(), category: z.string().trim().min(1).max(100), name: z.string().trim().min(1).max(200),
  metricType: z.enum(["count", "number", "boolean", "score"]).default("count"),
  sourceType: z.enum(["manual", "projects", "papers", "patents", "growth"]).default("manual"),
  sourceFilter: z.record(z.string(), z.unknown()).nullable().optional(), targetValue: z.coerce.number().min(0).default(1),
  manualValue: z.coerce.number().min(0).default(0), weight: z.coerce.number().min(0).default(1), required: z.boolean().default(false),
  evidenceNotes: z.string().max(5000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查指标内容", 400, "VALIDATION_ERROR");
  const id = crypto.randomUUID(); const now = nowIso(); const d = parsed.data;
  sqlite.prepare(`INSERT INTO promotion_metrics (id,cycle_id,category,name,metric_type,source_type,source_filter,target_value,manual_value,weight,required,evidence_notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, d.cycleId, d.category, d.name, d.metricType, d.sourceType, d.sourceFilter ? JSON.stringify(d.sourceFilter) : null, d.targetValue, d.manualValue, d.weight, d.required ? 1 : 0, d.evidenceNotes || null, now, now);
  return Response.json({ id }, { status: 201 });
}
