import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";
import { weekBounds } from "@/lib/workflow-data";
import { saveWeeklyReview, weeklyReviewInputSchema } from "@/lib/weekly-review";

export async function PUT(request: NextRequest) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const parsed=weeklyReviewInputSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return jsonError("请检查复盘内容",400,"VALIDATION_ERROR");
  const item=saveWeeklyReview(parsed.data,"web");
  return Response.json({ok:true,item});
}

export async function GET() {
  const auth=await requireApiSession(); if("response" in auth) return auth.response;
  const {start}=weekBounds();
  const item=sqlite.prepare("SELECT * FROM weekly_reviews WHERE period_start=? LIMIT 1").get(start) ?? null;
  return Response.json({item});
}
