import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { weekBounds } from "@/lib/workflow-data";
import { logActivity } from "@/lib/activity";

const schema=z.object({
  periodStart:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reflection:z.string().max(10000).nullable().optional(),
  nextFocus:z.string().max(10000).nullable().optional(),
});

export async function PUT(request: NextRequest) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return jsonError("请检查复盘内容",400,"VALIDATION_ERROR");
  const d=parsed.data, now=nowIso();
  const existing=sqlite.prepare("SELECT id FROM weekly_reviews WHERE period_start=?").get(d.periodStart) as {id:string}|undefined;
  if(existing) {
    sqlite.prepare("UPDATE weekly_reviews SET period_end=?,reflection=?,next_focus=?,updated_at=? WHERE id=?")
      .run(d.periodEnd,d.reflection||null,d.nextFocus||null,now,existing.id);
    logActivity("update", `更新周复盘：${d.periodStart}`, "reviews", existing.id);
    return Response.json({id:existing.id,ok:true});
  }
  const id=crypto.randomUUID();
  sqlite.prepare("INSERT INTO weekly_reviews (id,period_start,period_end,reflection,next_focus,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
    .run(id,d.periodStart,d.periodEnd,d.reflection||null,d.nextFocus||null,now,now);
  logActivity("create", `创建周复盘：${d.periodStart}`, "reviews", id);
  return Response.json({id,ok:true},{status:201});
}

export async function GET() {
  const auth=await requireApiSession(); if("response" in auth) return auth.response;
  const {start}=weekBounds();
  const item=sqlite.prepare("SELECT * FROM weekly_reviews WHERE period_start=? LIMIT 1").get(start) ?? null;
  return Response.json({item});
}
