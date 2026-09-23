import fs from "node:fs";
import path from "node:path";
import { createBackupBuffer } from "@/lib/backup";
import { requireApiSession } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const buffer = await createBackupBuffer();
  const name = `research-workbench-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
  const exportDir = path.resolve(process.env.EXPORT_DIR ?? path.join(process.cwd(), "data", "exports")); fs.mkdirSync(exportDir, { recursive: true }); fs.writeFileSync(path.join(exportDir, name), buffer);
  return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
