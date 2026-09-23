import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  return Response.json({ items: sqlite.prepare("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100").all() });
}
