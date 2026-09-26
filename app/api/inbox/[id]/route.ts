import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  body: z.string().max(5000).nullable().optional(),
  kind: z.enum(["note","idea","link"]).optional(),
  sourceUrl: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["inbox","processed"]).optional(),
}).refine((value)=>Object.keys(value).length>0,"没有可更新内容");

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const {id}=await context.params; const parsed=patchSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return jsonError("请检查收集内容",400,"VALIDATION_ERROR");
  const map: Record<string,string>={title:"title",body:"body",kind:"kind",sourceUrl:"source_url",status:"status"};
  const entries=Object.entries(parsed.data);
  const result=sqlite.prepare(`UPDATE inbox_items SET ${entries.map(([k])=>`${map[k]}=?`).join(",")}, updated_at=? WHERE id=? AND archived_at IS NULL`)
    .run(...entries.map(([,v])=>v||null),nowIso(),id);
  if(!result.changes) return jsonError("记录不存在",404,"NOT_FOUND");
  return Response.json({ok:true});
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const {id}=await context.params; const now=nowIso();
  sqlite.prepare("UPDATE inbox_items SET archived_at=?,updated_at=? WHERE id=?").run(now,now,id);
  return Response.json({ok:true});
}
