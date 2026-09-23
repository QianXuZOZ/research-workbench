import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import { createHash } from "node:crypto";
import { sqlite } from "@/lib/db";

export const BACKUP_SCHEMA_VERSION = 1;
export const backupTables = ["projects", "papers", "literature_items", "patents", "growth_items", "tasks", "promotion_cycles", "promotion_metrics", "attachments", "tags", "record_tags", "research_links", "activity_logs", "settings"] as const;

export async function createBackupBuffer() {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const output = new PassThrough(); const chunks: Buffer[] = [];
  output.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => { output.on("end", () => resolve(Buffer.concat(chunks))); output.on("error", reject); archive.on("error", reject); });
  archive.pipe(output);
  const data = Object.fromEntries(backupTables.map((table) => [table, sqlite.prepare(`SELECT * FROM ${table}`).all()]));
  const dataBuffer = Buffer.from(JSON.stringify({ schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), tables: data }, null, 2));
  const manifest: { schemaVersion: number; exportedAt: string; files: { path: string; sha256: string; size: number }[] } = { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString(), files: [{ path: "data.json", sha256: createHash("sha256").update(dataBuffer).digest("hex"), size: dataBuffer.length }] };
  archive.append(dataBuffer, { name: "data.json" });
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  const attachments = data.attachments as Record<string, unknown>[];
  for (const item of attachments) {
    const filePath = path.join(uploadDir, String(item.storage_name));
    if (!fs.existsSync(filePath)) continue;
    const buffer = fs.readFileSync(filePath); const name = `attachments/${item.storage_name}`;
    manifest.files.push({ path: name, sha256: createHash("sha256").update(buffer).digest("hex"), size: buffer.length }); archive.append(buffer, { name });
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
  await archive.finalize();
  return done;
}
