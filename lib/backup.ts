import archiver from "archiver";
import fs from "node:fs";
import path from "node:path";
import { PassThrough } from "node:stream";
import { createHash } from "node:crypto";
import { sqlite } from "@/lib/db";

export const BACKUP_SCHEMA_VERSION = 3;
export const backupTables = ["projects", "papers", "literature_items", "research_questions", "hypotheses", "experiments", "experiment_runs", "findings", "artifacts", "patents", "growth_items", "tasks", "promotion_cycles", "promotion_metrics", "promotion_evidence_links", "attachments", "tags", "record_tags", "research_links", "record_revisions", "activity_logs", "inbox_items", "weekly_reviews", "settings"] as const;


async function sha256File(filePath: string) {
  return await new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export async function createBackupFile(destination: string) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const archive = archiver("zip", { zlib: { level: 6 } });
  const output = fs.createWriteStream(destination, { flags: "w" });
  const done = new Promise<void>((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });
  archive.pipe(output);

  const data = Object.fromEntries(backupTables.map((table) => [table, sqlite.prepare(`SELECT * FROM ${table}`).all()]));
  const exportedAt = new Date().toISOString();
  const dataBuffer = Buffer.from(JSON.stringify({ schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt, tables: data }, null, 2));
  const manifest: { schemaVersion: number; exportedAt: string; files: { path: string; sha256: string; size: number }[] } = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    files: [{ path: "data.json", sha256: createHash("sha256").update(dataBuffer).digest("hex"), size: dataBuffer.length }],
  };
  archive.append(dataBuffer, { name: "data.json" });

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  const attachments = data.attachments as Record<string, unknown>[];
  for (const item of attachments) {
    const filePath = path.join(uploadDir, String(item.storage_name));
    if (!fs.existsSync(filePath)) continue;
    const stat = fs.statSync(filePath);
    const name = `attachments/${item.storage_name}`;
    manifest.files.push({ path: name, sha256: await sha256File(filePath), size: stat.size });
    archive.file(filePath, { name });
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
  await archive.finalize();
  await done;
  return destination;
}

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
