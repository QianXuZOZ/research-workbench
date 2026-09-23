import { afterAll, beforeAll, describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-workbench-backup-"));
process.env.DATABASE_PATH = path.join(tempDir, "workbench.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");

describe("versioned backup export", () => {
  beforeAll(() => fs.mkdirSync(process.env.UPLOAD_DIR!, { recursive: true }));
  afterAll(async () => {
    const { sqlite } = await import("../lib/db");
    sqlite.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("contains data, a manifest, attachments, and matching hashes", async () => {
    const [{ sqlite }, { createBackupBuffer }] = await Promise.all([import("../lib/db"), import("../lib/backup")]);
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();
    const attachmentId = crypto.randomUUID();
    const storageName = `${attachmentId}.pdf`;
    const attachment = Buffer.from("backup fixture");
    fs.writeFileSync(path.join(process.env.UPLOAD_DIR!, storageName), attachment);
    sqlite.prepare("INSERT INTO projects (id,title,status,progress,risk,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .run(projectId, "备份验证项目", "active", 0, "normal", now, now);
    sqlite.prepare("INSERT INTO attachments (id,entity_type,entity_id,original_name,storage_name,mime_type,size,sha256,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .run(attachmentId, "projects", projectId, "evidence.pdf", storageName, "application/pdf", attachment.length, createHash("sha256").update(attachment).digest("hex"), now);

    const zip = new AdmZip(await createBackupBuffer());
    const dataBuffer = zip.readFile("data.json");
    const manifestBuffer = zip.readFile("manifest.json");
    expect(dataBuffer).not.toBeNull();
    expect(manifestBuffer).not.toBeNull();
    expect(zip.readFile(`attachments/${storageName}`)?.equals(attachment)).toBe(true);

    const data = JSON.parse(dataBuffer!.toString("utf8"));
    const manifest = JSON.parse(manifestBuffer!.toString("utf8"));
    expect(data.schemaVersion).toBe(1);
    expect(data.tables.projects.some((item: { id: string }) => item.id === projectId)).toBe(true);
    const dataEntry = manifest.files.find((item: { path: string }) => item.path === "data.json");
    expect(dataEntry.sha256).toBe(createHash("sha256").update(dataBuffer!).digest("hex"));
  });
});
