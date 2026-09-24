import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const ENTITY_TYPE = "profile";
const ENTITY_ID = "avatar";
const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
const extByType: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

async function sha256File(filePath: string) {
  const hash = createHash("sha256");
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest("hex");
}

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const row = sqlite.prepare("SELECT storage_name AS storageName,mime_type AS mimeType FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC LIMIT 1")
    .get(ENTITY_TYPE, ENTITY_ID) as { storageName: string; mimeType: string } | undefined;
  if (!row) return jsonError("未设置头像", 404, "NOT_FOUND");
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  const filePath = path.join(uploadDir, row.storageName);
  if (!fs.existsSync(filePath)) return jsonError("头像文件不存在", 404, "NOT_FOUND");
  const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { headers: { "Content-Type": row.mimeType, "Cache-Control": "private, max-age=300" } });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("请选择头像文件", 400, "VALIDATION_ERROR");
  if (!allowed.has(file.type)) return jsonError("仅支持 PNG、JPG 或 WebP", 415, "UNSUPPORTED_FILE");
  if (file.size > 2 * 1024 * 1024) return jsonError("头像不能超过 2 MB", 413, "FILE_TOO_LARGE");

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  fs.mkdirSync(uploadDir, { recursive: true });
  const id = crypto.randomUUID();
  const storageName = `profile-avatar-${id}${extByType[file.type]}`;
  const target = path.join(uploadDir, storageName);

  try {
    await pipeline(Readable.fromWeb(file.stream() as never), fs.createWriteStream(target, { flags: "wx" }));
    const sha256 = await sha256File(target);
    const previous = sqlite.prepare("SELECT id,storage_name AS storageName FROM attachments WHERE entity_type=? AND entity_id=?")
      .all(ENTITY_TYPE, ENTITY_ID) as { id: string; storageName: string }[];

    sqlite.transaction(() => {
      sqlite.prepare("DELETE FROM attachments WHERE entity_type=? AND entity_id=?").run(ENTITY_TYPE, ENTITY_ID);
      sqlite.prepare("INSERT INTO attachments (id,entity_type,entity_id,original_name,storage_name,mime_type,size,sha256,label,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
        .run(id, ENTITY_TYPE, ENTITY_ID, file.name || storageName, storageName, file.type, file.size, sha256, "用户头像", nowIso());
    })();

    for (const item of previous) fs.rmSync(path.join(uploadDir, item.storageName), { force: true });
  } catch (error) {
    fs.rmSync(target, { force: true });
    throw error;
  }
  return Response.json({ ok: true, avatarUrl: `/api/profile/avatar?v=${Date.now()}` });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  const rows = sqlite.prepare("SELECT storage_name AS storageName FROM attachments WHERE entity_type=? AND entity_id=?")
    .all(ENTITY_TYPE, ENTITY_ID) as { storageName: string }[];
  sqlite.prepare("DELETE FROM attachments WHERE entity_type=? AND entity_id=?").run(ENTITY_TYPE, ENTITY_ID);
  for (const row of rows) fs.rmSync(path.join(uploadDir, row.storageName), { force: true });
  return Response.json({ ok: true });
}
