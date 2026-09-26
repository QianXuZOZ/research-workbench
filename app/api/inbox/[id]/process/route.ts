import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { createQuickCapture } from "@/lib/quick-capture";

const schema=z.object({ targetType:z.enum(["task","question","finding","literature"]) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const {id}=await context.params; const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return jsonError("请选择转换类型",400,"VALIDATION_ERROR");
  const item=sqlite.prepare("SELECT * FROM inbox_items WHERE id=? AND archived_at IS NULL").get(id) as Record<string,unknown>|undefined;
  if(!item) return jsonError("Inbox 记录不存在",404,"NOT_FOUND");
  if(item.status==="processed") return jsonError("该记录已经处理",409,"ALREADY_PROCESSED");
  const created=createQuickCapture({
    type:parsed.data.targetType,
    title:String(item.title),
    notes:item.body?String(item.body):null,
    url:item.source_url?String(item.source_url):null,
  });
  const now=nowIso();
  sqlite.prepare("UPDATE inbox_items SET status='processed',target_type=?,target_id=?,processed_at=?,updated_at=? WHERE id=?")
    .run(parsed.data.targetType,created.id,now,now,id);
  return Response.json({ok:true,targetType:created.type,targetId:created.id});
}
