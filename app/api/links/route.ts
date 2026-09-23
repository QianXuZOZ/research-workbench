import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const schema = z.object({ sourceType: z.string().max(30), sourceId: z.string().uuid(), targetType: z.string().max(30), targetId: z.string().uuid(), relation: z.string().max(60).default("related") });

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.sourceType === parsed.data.targetType && parsed.data.sourceId === parsed.data.targetId)) return jsonError("关联记录无效", 400, "VALIDATION_ERROR");
  try {
    const id = crypto.randomUUID();
    sqlite.prepare("INSERT INTO research_links (id,source_type,source_id,target_type,target_id,relation,created_at) VALUES (?,?,?,?,?,?,?)").run(id, parsed.data.sourceType, parsed.data.sourceId, parsed.data.targetType, parsed.data.targetId, parsed.data.relation, nowIso());
    return Response.json({ id }, { status: 201 });
  } catch {
    return jsonError("该关联已存在", 409, "DUPLICATE");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("缺少关联标识");
  sqlite.prepare("DELETE FROM research_links WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
