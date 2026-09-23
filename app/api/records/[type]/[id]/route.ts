import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { fromDatabase, isRecordType, recordLabels, recordSchemas, recordTables, toDatabase } from "@/lib/records";
import { requireApiSession } from "@/lib/security";
import { deleteSearchIndex, updateSearchIndex } from "@/lib/search";
import { calendarDateInTimeZone, jsonError, normalizeDoi, nowIso } from "@/lib/utils";

export async function GET(_request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { type, id } = await context.params;
  if (!isRecordType(type)) return jsonError("未知记录类型", 404, "NOT_FOUND");
  const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return jsonError("记录不存在", 404, "NOT_FOUND");
  const tasks = sqlite.prepare("SELECT * FROM tasks WHERE entity_type = ? AND entity_id = ? AND archived_at IS NULL ORDER BY due_at IS NULL, due_at").all(type, id);
  const attachments = sqlite.prepare("SELECT id, original_name AS originalName, mime_type AS mimeType, size, label, created_at AS createdAt FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC").all(type, id);
  const rawLinks = sqlite.prepare("SELECT * FROM research_links WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?) ORDER BY created_at DESC").all(type, id, type, id) as Record<string, unknown>[];
  const links = rawLinks.map((link) => {
    const otherType = link.source_type === type && link.source_id === id ? String(link.target_type) : String(link.source_type);
    const otherId = link.source_type === type && link.source_id === id ? String(link.target_id) : String(link.source_id);
    const table = isRecordType(otherType) ? recordTables[otherType] : null;
    const other = table ? sqlite.prepare(`SELECT title FROM ${table} WHERE id = ?`).get(otherId) as { title: string } | undefined : undefined;
    return { ...link, otherType, otherId, otherTitle: other?.title ?? "记录已删除" };
  });
  return Response.json({ item: fromDatabase(type, row), tasks, attachments, links });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { type, id } = await context.params;
  if (!isRecordType(type)) return jsonError("未知记录类型", 404, "NOT_FOUND");
  const current = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!current) return jsonError("记录不存在", 404, "NOT_FOUND");
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return jsonError("请求内容无效");
  if (Object.keys(body).length === 1 && "archived" in body) {
    sqlite.prepare(`UPDATE ${recordTables[type]} SET archived_at = ?, updated_at = ? WHERE id = ?`).run(body.archived ? nowIso() : null, nowIso(), id);
    logActivity(body.archived ? "archive" : "restore", `${body.archived ? "归档" : "恢复"}${recordLabels[type]}：${current.title}`, type, id);
  } else {
    const parsed = recordSchemas[type].safeParse({ ...fromDatabase(type, current), ...body });
    if (!parsed.success) return jsonError("请检查填写内容", 400, "VALIDATION_ERROR", Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message])));
    const data = { ...parsed.data } as Record<string, unknown>;
    if (type === "papers" || type === "literature") data.doi = normalizeDoi(String(data.doi ?? ""));
    if (type === "projects" && data.status === "completed" && !data.completedAt) data.completedAt = calendarDateInTimeZone();
    const values = toDatabase(type, data);
    try {
      sqlite.prepare(`UPDATE ${recordTables[type]} SET ${Object.keys(values).map((key) => `${key} = ?`).join(",")}, updated_at = ? WHERE id = ?`).run(...Object.values(values), nowIso(), id);
    } catch (error) {
      if (String(error).includes("UNIQUE")) return jsonError("编号或 DOI 已存在", 409, "DUPLICATE");
      throw error;
    }
    updateSearchIndex(type, id, String(data.title), Object.values(data).filter((value) => typeof value === "string").join(" "));
    logActivity("update", `更新${recordLabels[type]}：${data.title}`, type, id);
  }
  const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown>;
  return Response.json({ item: fromDatabase(type, row) });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { type, id } = await context.params;
  if (!isRecordType(type)) return jsonError("未知记录类型", 404, "NOT_FOUND");
  const row = sqlite.prepare(`SELECT title FROM ${recordTables[type]} WHERE id = ?`).get(id) as { title: string } | undefined;
  if (!row) return jsonError("记录不存在", 404, "NOT_FOUND");
  const files = sqlite.prepare("SELECT storage_name FROM attachments WHERE entity_type = ? AND entity_id = ?").all(type, id) as { storage_name: string }[];
  sqlite.transaction(() => {
    sqlite.prepare(`DELETE FROM ${recordTables[type]} WHERE id = ?`).run(id);
    sqlite.prepare("DELETE FROM tasks WHERE entity_type = ? AND entity_id = ?").run(type, id);
    sqlite.prepare("DELETE FROM attachments WHERE entity_type = ? AND entity_id = ?").run(type, id);
    sqlite.prepare("DELETE FROM research_links WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)").run(type, id, type, id);
    sqlite.prepare("DELETE FROM record_tags WHERE entity_type = ? AND entity_id = ?").run(type, id);
    deleteSearchIndex(type, id);
  })();
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
  for (const file of files) fs.rmSync(path.join(uploadDir, file.storage_name), { force: true });
  logActivity("delete", `删除${recordLabels[type]}：${row.title}`, type, id);
  return Response.json({ ok: true });
}
