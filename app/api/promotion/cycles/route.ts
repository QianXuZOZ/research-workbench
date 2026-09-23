import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { getPromotionOverview } from "@/lib/promotion";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const schema = z.object({ title: z.string().trim().min(1).max(200), targetRole: z.string().trim().max(200).nullable().optional(), status: z.enum(["planning", "active", "submitted", "completed"]).default("active"), startsAt: z.string().nullable().optional(), dueAt: z.string().nullable().optional(), notes: z.string().max(5000).nullable().optional() });

export async function GET() {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  return Response.json({ items: getPromotionOverview() });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查评审周期内容", 400, "VALIDATION_ERROR");
  const id = crypto.randomUUID();
  const now = nowIso();
  const d = parsed.data;
  sqlite.prepare("INSERT INTO promotion_cycles (id,title,target_role,status,starts_at,due_at,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, d.title, d.targetRole || null, d.status, d.startsAt || null, d.dueAt || null, d.notes || null, now, now);
  logActivity("create", `新建晋升周期：${d.title}`, "promotion", id);
  return Response.json({ id }, { status: 201 });
}
