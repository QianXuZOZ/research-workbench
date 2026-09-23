import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const row = sqlite.prepare("SELECT * FROM attachments WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return jsonError("附件不存在", 404, "NOT_FOUND");
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")); const filePath = path.join(uploadDir, String(row.storage_name));
  if (!fs.existsSync(filePath)) return jsonError("附件文件已丢失", 404, "FILE_MISSING");
  return new Response(fs.readFileSync(filePath), { headers: { "Content-Type": String(row.mime_type), "Content-Length": String(row.size), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(String(row.original_name))}`, "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const row = sqlite.prepare("SELECT storage_name FROM attachments WHERE id = ?").get(id) as { storage_name: string } | undefined;
  if (!row) return jsonError("附件不存在", 404, "NOT_FOUND");
  sqlite.prepare("DELETE FROM attachments WHERE id = ?").run(id);
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")); fs.rmSync(path.join(uploadDir, row.storage_name), { force: true });
  return Response.json({ ok: true });
}
