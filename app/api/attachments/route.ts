import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso, safeFilename } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".webp", ".zip"]);

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const form = await request.formData();
  const file = form.get("file"); const entityType = String(form.get("entityType") ?? ""); const entityId = String(form.get("entityId") ?? ""); const label = String(form.get("label") ?? "").slice(0, 100);
  if (!(file instanceof File) || !entityType || !/^[0-9a-f-]{36}$/i.test(entityId)) return jsonError("附件信息不完整", 400, "VALIDATION_ERROR");
  const maxBytes = Math.max(1, Number(process.env.MAX_UPLOAD_MB ?? 100)) * 1024 * 1024;
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(ext)) return jsonError("不支持该文件类型", 415, "UNSUPPORTED_FILE");
  if (file.size > maxBytes) return jsonError(`文件不能超过 ${process.env.MAX_UPLOAD_MB ?? 100} MB`, 413, "FILE_TOO_LARGE");
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")); fs.mkdirSync(uploadDir, { recursive: true });
  const id = crypto.randomUUID(); const storageName = `${id}${ext}`; const target = path.join(uploadDir, storageName);
  fs.writeFileSync(target, buffer, { flag: "wx" });
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  sqlite.prepare("INSERT INTO attachments (id,entity_type,entity_id,original_name,storage_name,mime_type,size,sha256,label,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(id, entityType, entityId, safeFilename(file.name), storageName, file.type || "application/octet-stream", file.size, sha256, label || null, nowIso());
  logActivity("upload", `上传附件：${safeFilename(file.name)}`, entityType, entityId);
  return Response.json({ item: { id, originalName: safeFilename(file.name), size: file.size, label } }, { status: 201 });
}
