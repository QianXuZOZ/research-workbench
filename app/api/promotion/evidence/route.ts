import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const schema = z.object({
  metricId: z.string().uuid(),
  entityType: z.string().trim().min(1).max(30),
  entityId: z.string().uuid(),
  note: z.string().max(1000).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("证据关联无效", 400, "VALIDATION_ERROR");
  const d = parsed.data; const id = crypto.randomUUID();
  try {
    sqlite.prepare("INSERT INTO promotion_evidence_links (id,metric_id,entity_type,entity_id,note,created_at) VALUES (?,?,?,?,?,?)")
      .run(id, d.metricId, d.entityType, d.entityId, d.note || null, nowIso());
  } catch { return jsonError("该证据已关联", 409, "DUPLICATE"); }
  return Response.json({ id }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("缺少证据标识");
  sqlite.prepare("DELETE FROM promotion_evidence_links WHERE id=?").run(id);
  return Response.json({ ok: true });
}
