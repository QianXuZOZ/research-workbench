import { NextRequest } from "next/server";
import { destroySession } from "@/lib/auth";
import { requireApiSession } from "@/lib/security";

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  await destroySession();
  return Response.json({ ok: true });
}
