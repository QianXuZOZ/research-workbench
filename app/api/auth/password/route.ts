import { NextRequest } from "next/server";
import { z } from "zod";
import { changePassword } from "@/lib/auth";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";

const schema = z.object({ currentPassword: z.string().min(1), nextPassword: z.string().min(12, "新密码至少 12 位").max(200) });

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "密码格式不正确", 400, "VALIDATION_ERROR");
  const changed = await changePassword(auth.session.id, parsed.data.currentPassword, parsed.data.nextPassword);
  if (!changed) return jsonError("当前密码不正确", 400, "INVALID_PASSWORD");
  return Response.json({ ok: true, relogin: true });
}
