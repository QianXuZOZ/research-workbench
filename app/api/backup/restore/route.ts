import AdmZip from "adm-zip";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { BACKUP_SCHEMA_VERSION, backupTables } from "@/lib/backup";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";
import { updateSearchIndex } from "@/lib/search";

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const count = ["projects", "papers", "patents", "growth_items", "tasks", "promotion_cycles"].reduce((sum, table) => sum + Number((sqlite.prepare(`SELECT COUNT(*) count FROM ${table}`).get() as { count: number }).count), 0);
  if (count > 0) return jsonError("恢复仅允许在空白实例中进行。请先使用新的数据目录启动应用。", 409, "INSTANCE_NOT_EMPTY");
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".zip")) return jsonError("请选择工作台备份 ZIP", 400, "VALIDATION_ERROR");
  if (file.size > 2_000_000_000) return jsonError("备份文件过大", 413, "FILE_TOO_LARGE");
  let zip: AdmZip;
  try { zip = new AdmZip(Buffer.from(await file.arrayBuffer())); } catch { return jsonError("无法读取备份文件", 400, "INVALID_BACKUP"); }
  const dataEntry = zip.getEntry("data.json"); const manifestEntry = zip.getEntry("manifest.json");
  if (!dataEntry || !manifestEntry) return jsonError("备份缺少数据或校验清单", 400, "INVALID_BACKUP");
  let payload: { schemaVersion: number; tables: Record<string, Record<string, unknown>[]> }; let manifest: { schemaVersion: number; files: { path: string; sha256: string }[] };
  try { payload = JSON.parse(dataEntry.getData().toString("utf8")); manifest = JSON.parse(manifestEntry.getData().toString("utf8")); } catch { return jsonError("备份数据格式无效", 400, "INVALID_BACKUP"); }
  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION || manifest.schemaVersion !== BACKUP_SCHEMA_VERSION) return jsonError("备份版本与当前程序不兼容", 409, "BACKUP_VERSION_MISMATCH");
  for (const item of manifest.files) {
    if (item.path.includes("..") || path.isAbsolute(item.path)) return jsonError("备份包含不安全路径", 400, "INVALID_BACKUP");
    const entry = zip.getEntry(item.path); if (!entry) return jsonError(`备份缺少 ${item.path}`, 400, "INVALID_BACKUP");
    const actual = createHash("sha256").update(entry.getData()).digest("hex"); if (actual !== item.sha256) return jsonError(`文件校验失败：${item.path}`, 400, "BACKUP_CHECKSUM_FAILED");
  }
  try {
    sqlite.transaction(() => {
      for (const table of backupTables) {
        const rows = payload.tables[table] ?? []; const allowed = (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((column) => column.name);
        for (const row of rows) {
          const entries = Object.entries(row).filter(([key]) => allowed.includes(key)); if (!entries.length) continue;
          sqlite.prepare(`INSERT INTO ${table} (${entries.map(([key]) => key).join(",")}) VALUES (${entries.map(() => "?").join(",")})`).run(...entries.map(([, value]) => value));
        }
      }
    })();
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads")); fs.mkdirSync(uploadDir, { recursive: true });
    for (const item of manifest.files.filter((item) => item.path.startsWith("attachments/"))) {
      const name = path.basename(item.path); fs.writeFileSync(path.join(uploadDir, name), zip.getEntry(item.path)!.getData(), { flag: "wx" });
    }
    const searchable = [
      ["projects", "projects", ["title", "summary", "notes", "keywords"]], ["papers", "papers", ["title", "abstract", "notes", "keywords"]],
      ["patents", "patents", ["title", "abstract", "notes", "keywords"]], ["growth_items", "growth", ["title", "evidence", "notes", "keywords"]], ["tasks", "tasks", ["title", "notes"]],
    ] as const;
    for (const [table, type, fields] of searchable) for (const row of sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[]) updateSearchIndex(type, String(row.id), String(row.title), fields.slice(1).map((field) => String(row[field] ?? "")).join(" "));
    return Response.json({ ok: true, restoredTables: backupTables.length });
  } catch (error) {
    return jsonError(`恢复失败：${error instanceof Error ? error.message : "未知错误"}`, 400, "RESTORE_FAILED");
  }
}
