import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().max(5000).nullable().optional(),
  kind: z.enum(["note","idea","link"]).default("note"),
  sourceUrl: z.string().trim().max(2000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const status = request.nextUrl.searchParams.get("status") ?? "inbox";
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const where = ["archived_at IS NULL", "status = ?"]; const values: unknown[] = [status];
  if (q) { where.push("(title LIKE ? OR body LIKE ? OR source_url LIKE ?)"); values.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  const items = sqlite.prepare(`SELECT * FROM inbox_items WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 200`).all(...values);
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查收集内容", 400, "VALIDATION_ERROR");
  const id=crypto.randomUUID(), now=nowIso(), d=parsed.data;
  sqlite.prepare("INSERT INTO inbox_items (id,title,body,kind,source_url,status,created_at,updated_at) VALUES (?,?,?,?,?,'inbox',?,?)")
    .run(id,d.title,d.body||null,d.kind,d.sourceUrl||null,now,now);
  logActivity("create", `收集到 Inbox：${d.title}`, "inbox", id);
  return Response.json({ id }, { status: 201 });
}
