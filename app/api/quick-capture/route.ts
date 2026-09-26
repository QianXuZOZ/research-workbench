import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";
import { createQuickCapture } from "@/lib/quick-capture";

const schema = z.object({
  type: z.enum(["inbox","task","question","finding","literature"]),
  title: z.string().trim().min(1).max(300),
  notes: z.string().max(5000).nullable().optional(),
  url: z.string().trim().max(2000).nullable().optional(),
  dueAt: z.string().trim().max(40).nullable().optional(),
  priority: z.enum(["low","medium","high","urgent"]).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查快速记录内容", 400, "VALIDATION_ERROR");
  return Response.json(createQuickCapture(parsed.data), { status: 201 });
}
