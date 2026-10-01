import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";
import { inboxTargetSchema, processInboxItem } from "@/lib/inbox-workflow";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth=await requireApiSession(request); if("response" in auth) return auth.response;
  const {id}=await context.params;
  const parsed=inboxTargetSchema.safeParse((await request.json().catch(()=>null))?.targetType);
  if(!parsed.success) return jsonError("请选择转换类型",400,"VALIDATION_ERROR");
  try {
    return Response.json(processInboxItem(id, parsed.data, "web"));
  } catch (error) {
    const message=error instanceof Error?error.message:"";
    if(message==="INBOX_NOT_FOUND") return jsonError("Inbox 记录不存在",404,"NOT_FOUND");
    if(message==="ALREADY_PROCESSED") return jsonError("该记录已经处理",409,"ALREADY_PROCESSED");
    throw error;
  }
}
