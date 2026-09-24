import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { createBackupFile } from "@/lib/backup";
import { requireApiSession } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const name = `research-workbench-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
  const exportDir = path.resolve(process.env.EXPORT_DIR ?? path.join(process.cwd(), "data", "exports"));
  const filePath = path.join(exportDir, name);
  await createBackupFile(filePath);
  const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
