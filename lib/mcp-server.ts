import { createHmac, timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { fromDatabase, isRecordType, recordLabels, recordSchemas, recordTables, toDatabase, type RecordType } from "@/lib/records";
import { updateSearchIndex } from "@/lib/search";
import { calendarDateInTimeZone, normalizeDoi, nowIso } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { saveRevision } from "@/lib/revisions";
import { getPromotionOverview } from "@/lib/promotion";

const recordTypeSchema = z.enum(["projects", "papers", "literature", "questions", "hypotheses", "experiments", "runs", "findings", "artifacts", "patents", "growth"]);
const taskStatusSchema = z.enum(["todo", "doing", "done", "blocked"]);
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const bulkOperationSchema = z.enum(["create_records", "update_records", "create_tasks", "update_tasks"]);

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined,
  };
}

function prepareRecord(type: RecordType, raw: unknown) {
  const parsed = recordSchemas[type].safeParse(raw);
  if (!parsed.success) {
    const details = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
    throw new Error(`Invalid ${type} record: ${JSON.stringify(details)}`);
  }
  const data = { ...parsed.data } as Record<string, unknown>;
  if (type === "papers" || type === "literature") data.doi = normalizeDoi(String(data.doi ?? ""));
  if (type === "projects" && data.status === "completed" && !data.completedAt) data.completedAt = calendarDateInTimeZone();
  return data;
}

function insertRecord(type: RecordType, data: Record<string, unknown>) {
  const id = crypto.randomUUID(); const now = nowIso(); const values = toDatabase(type, data);
  const columns = ["id", ...Object.keys(values), "created_at", "updated_at"];
  sqlite.prepare(`INSERT INTO ${recordTables[type]} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
    .run(id, ...Object.values(values), now, now);
  updateSearchIndex(type, id, String(data.title), Object.values(data).filter((value) => typeof value === "string").join(" "));
  logActivity("create", `MCP 新建${recordLabels[type]}：${data.title}`, type, id);
  return fromDatabase(type, sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id=?`).get(id) as Record<string, unknown>);
}

function updateRecord(type: RecordType, id: string, patch: Record<string, unknown>) {
  const current = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id=?`).get(id) as Record<string, unknown> | undefined;
  if (!current) throw new Error("Record not found");
  const data = prepareRecord(type, { ...fromDatabase(type, current), ...patch });
  const values = toDatabase(type, data);
  saveRevision(type, id, fromDatabase(type, current), "mcp");
  sqlite.prepare(`UPDATE ${recordTables[type]} SET ${Object.keys(values).map((key) => `${key}=?`).join(",")},updated_at=? WHERE id=?`)
    .run(...Object.values(values), nowIso(), id);
  updateSearchIndex(type, id, String(data.title), Object.values(data).filter((value) => typeof value === "string").join(" "));
  logActivity("update", `MCP 更新${recordLabels[type]}：${data.title}`, type, id);
  return fromDatabase(type, sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id=?`).get(id) as Record<string, unknown>);
}

const taskInput = z.object({
  title: z.string().trim().min(1).max(300),
  kind: z.enum(["task", "milestone"]).default("task"),
  status: taskStatusSchema.default("todo"),
  priority: prioritySchema.default("medium"),
  dueAt: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  entityType: z.string().max(30).nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

function insertTask(raw: z.infer<typeof taskInput>) {
  const data = taskInput.parse(raw);
  if (data.entityType && data.entityId && isRecordType(data.entityType)) {
    const parent = sqlite.prepare(`SELECT 1 FROM ${recordTables[data.entityType]} WHERE id=? AND archived_at IS NULL`).get(data.entityId);
    if (!parent) throw new Error("Linked parent record does not exist");
  }
  const id = crypto.randomUUID(); const now = nowIso(); const completedAt = data.status === "done" ? now : null;
  sqlite.prepare(`INSERT INTO tasks (id,title,kind,status,priority,due_at,start_at,completed_at,progress,entity_type,entity_id,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id, data.title, data.kind, data.status, data.priority, data.dueAt || null, data.startAt || null, completedAt, data.status === "done" ? 100 : data.progress, data.entityType || null, data.entityId || null, data.notes || null, now, now);
  updateSearchIndex("tasks", id, data.title, data.notes ?? "");
  logActivity("create", `MCP 新建${data.kind === "milestone" ? "里程碑" : "任务"}：${data.title}`, "tasks", id);
  return sqlite.prepare("SELECT * FROM tasks WHERE id=?").get(id) as Record<string, unknown>;
}

function camel(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase()), value]));
}

function updateTask(id: string, patch: Record<string, unknown>) {
  const current = sqlite.prepare("SELECT * FROM tasks WHERE id=?").get(id) as Record<string, unknown> | undefined;
  if (!current) throw new Error("Task not found");
  const data = taskInput.parse({ ...camel(current), ...patch });
  saveRevision("tasks", id, camel(current), "mcp");
  const completedAt = data.status === "done" ? String(current.completed_at ?? nowIso()) : null;
  sqlite.prepare(`UPDATE tasks SET title=?,kind=?,status=?,priority=?,due_at=?,start_at=?,completed_at=?,progress=?,entity_type=?,entity_id=?,notes=?,updated_at=? WHERE id=?`)
    .run(data.title, data.kind, data.status, data.priority, data.dueAt || null, data.startAt || null, completedAt, data.status === "done" ? 100 : data.progress, data.entityType || null, data.entityId || null, data.notes || null, nowIso(), id);
  updateSearchIndex("tasks", id, data.title, data.notes ?? "");
  logActivity("update", `MCP 更新任务：${data.title}`, "tasks", id);
  return sqlite.prepare("SELECT * FROM tasks WHERE id=?").get(id) as Record<string, unknown>;
}

function recordExists(type: string, id: string) {
  if (isRecordType(type)) return Boolean(sqlite.prepare(`SELECT 1 FROM ${recordTables[type]} WHERE id=?`).get(id));
  if (type === "tasks") return Boolean(sqlite.prepare("SELECT 1 FROM tasks WHERE id=?").get(id));
  return false;
}

function previewSecret() {
  const secret = process.env.MCP_ACCESS_TOKEN?.trim();
  if (!secret) throw new Error("MCP_ACCESS_TOKEN is required");
  return secret;
}

function makePreviewToken(operation: string, payload: unknown) {
  const encoded = Buffer.from(JSON.stringify({ operation, payload }), "utf8").toString("base64url");
  const signature = createHmac("sha256", previewSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function readPreviewToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid preview token");
  const expected = createHmac("sha256", previewSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid preview signature");
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as { operation: string; payload: Record<string, unknown> };
}

function executeBulk(operation: string, payload: Record<string, unknown>) {
  if (operation === "create_records") {
    const type = recordTypeSchema.parse(payload.type); const items = z.array(z.record(z.string(), z.unknown())).min(1).max(100).parse(payload.items);
    const validated = items.map((item) => prepareRecord(type, item));
    return { items: sqlite.transaction(() => validated.map((item) => insertRecord(type, item)))() };
  }
  if (operation === "update_records") {
    const type = recordTypeSchema.parse(payload.type);
    const items = z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).min(1).max(100).parse(payload.items);
    return { items: sqlite.transaction(() => items.map((item) => updateRecord(type, item.id, item.patch)))() };
  }
  if (operation === "create_tasks") {
    const items = z.array(taskInput).min(1).max(100).parse(payload.items);
    return { items: sqlite.transaction(() => items.map(insertTask))() };
  }
  if (operation === "update_tasks") {
    const items = z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).min(1).max(100).parse(payload.items);
    return { items: sqlite.transaction(() => items.map((item) => updateTask(item.id, item.patch)))() };
  }
  throw new Error("Unsupported bulk operation");
}

export function buildResearchMcpServer() {
  const server = new McpServer({ name: "research-workbench", version: "2.0.0" }, { capabilities: { tools: {} } });

  server.registerTool("search_records", {
    description: "Search all research records and tasks by title or keyword.",
    inputSchema: { query: z.string().trim().min(2).max(120), limit: z.number().int().min(1).max(50).default(20) },
    annotations: { readOnlyHint: true },
  }, async ({ query, limit }) => {
    const terms = query.split(/\s+/).filter(Boolean); const hasShortTerm = terms.some((term) => Array.from(term).length < 3);
    const items = hasShortTerm
      ? sqlite.prepare("SELECT entity_type AS entityType,entity_id AS entityId,title,substr(body,1,300) AS snippet FROM search_index WHERE title LIKE ? OR body LIKE ? LIMIT ?").all(`%${query}%`, `%${query}%`, limit)
      : sqlite.prepare("SELECT entity_type AS entityType,entity_id AS entityId,title,snippet(search_index,3,'','','…',24) AS snippet FROM search_index WHERE search_index MATCH ? LIMIT ?").all(terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(" AND "), limit);
    return result({ count: items.length, items });
  });

  server.registerTool("list_records", {
    description: "List records of one research type with optional status and text filters.",
    inputSchema: { type: recordTypeSchema, status: z.string().optional(), query: z.string().optional(), limit: z.number().int().min(1).max(200).default(100) },
    annotations: { readOnlyHint: true },
  }, async ({ type, status, query, limit }) => {
    const where = ["archived_at IS NULL"]; const values: unknown[] = [];
    if (status && type !== "artifacts") { where.push("status=?"); values.push(status); }
    if (query) { where.push("(title LIKE ? OR COALESCE(notes,'') LIKE ? OR COALESCE(keywords,'') LIKE ?)"); values.push(`%${query}%`, `%${query}%`, `%${query}%`); }
    values.push(limit);
    const rows = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE ${where.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`).all(...values) as Record<string, unknown>[];
    return result({ count: rows.length, items: rows.map((row) => fromDatabase(type, row)) });
  });

  server.registerTool("get_record", {
    description: "Get one record with tasks, attachments metadata, links, and recent revisions.",
    inputSchema: { type: recordTypeSchema, id: z.string().uuid() },
    annotations: { readOnlyHint: true },
  }, async ({ type, id }) => {
    const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id=?`).get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error("Record not found");
    const tasks = sqlite.prepare("SELECT * FROM tasks WHERE entity_type=? AND entity_id=? AND archived_at IS NULL ORDER BY due_at IS NULL,due_at").all(type, id);
    const attachments = sqlite.prepare("SELECT id,original_name AS originalName,mime_type AS mimeType,size,label,created_at AS createdAt FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC").all(type, id);
    const links = sqlite.prepare("SELECT * FROM research_links WHERE (source_type=? AND source_id=?) OR (target_type=? AND target_id=?) ORDER BY created_at DESC").all(type, id, type, id);
    const revisions = sqlite.prepare("SELECT id,actor,created_at AS createdAt FROM record_revisions WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC LIMIT 20").all(type, id);
    return result({ item: fromDatabase(type, row), tasks, attachments, links, revisions });
  });

  server.registerTool("get_dashboard", {
    description: "Get a compact dashboard summary for planning current research work.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  }, async () => {
    const timezone = process.env.APP_TIMEZONE ?? "Asia/Hong_Kong"; const today = calendarDateInTimeZone(new Date(), timezone);
    const weekEnd = calendarDateInTimeZone(new Date(Date.now() + 7 * 86400_000), timezone);
    const taskCounts = sqlite.prepare(`SELECT SUM(CASE WHEN status!='done' AND due_at<? THEN 1 ELSE 0 END) overdue,SUM(CASE WHEN status!='done' AND due_at>=? AND due_at<=? THEN 1 ELSE 0 END) dueWeek,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done,COUNT(*) total FROM tasks WHERE archived_at IS NULL`).get(today, today, weekEnd);
    const upcoming = sqlite.prepare("SELECT id,title,status,priority,due_at AS dueAt,entity_type AS entityType,entity_id AS entityId FROM tasks WHERE archived_at IS NULL AND status!='done' AND due_at IS NOT NULL AND due_at<=? ORDER BY due_at LIMIT 10").all(weekEnd);
    const process = Object.fromEntries(["research_questions","hypotheses","experiments","experiment_runs","findings","artifacts"].map((table) => [table, (sqlite.prepare(`SELECT COUNT(*) count FROM ${table} WHERE archived_at IS NULL`).get() as { count: number }).count]));
    return result({ today, weekEnd, taskCounts, upcoming, process, promotion: getPromotionOverview()[0] ?? null });
  });

  server.registerTool("list_tasks", {
    description: "List active tasks with optional status, parent record, and due-date filters.",
    inputSchema: { status: taskStatusSchema.optional(), entityType: z.string().max(30).optional(), entityId: z.string().uuid().optional(), dueBefore: z.string().optional(), limit: z.number().int().min(1).max(200).default(100) },
    annotations: { readOnlyHint: true },
  }, async ({ status, entityType, entityId, dueBefore, limit }) => {
    const where = ["archived_at IS NULL"]; const values: unknown[] = [];
    if (status) { where.push("status=?"); values.push(status); }
    if (entityType) { where.push("entity_type=?"); values.push(entityType); }
    if (entityId) { where.push("entity_id=?"); values.push(entityId); }
    if (dueBefore) { where.push("due_at IS NOT NULL AND due_at<=?"); values.push(dueBefore); }
    values.push(limit);
    const items = sqlite.prepare(`SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,due_at IS NULL,due_at LIMIT ?`).all(...values);
    return result({ count: items.length, items });
  });

  server.registerTool("create_record", { description: "Create one research record.", inputSchema: { type: recordTypeSchema, data: z.record(z.string(), z.unknown()) } }, async ({ type, data }) => result({ item: insertRecord(type, prepareRecord(type, data)) }));
  server.registerTool("update_record", { description: "Update one research record and preserve its previous version.", inputSchema: { type: recordTypeSchema, id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) } }, async ({ type, id, patch }) => result({ item: updateRecord(type, id, patch) }));
  server.registerTool("create_task", { description: "Create one task or milestone.", inputSchema: taskInput.shape }, async (input) => result({ item: insertTask(input) }));
  server.registerTool("update_task", { description: "Update one task and preserve its previous version.", inputSchema: { id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) } }, async ({ id, patch }) => result({ item: updateTask(id, patch) }));

  server.registerTool("bulk_create_records", { description: "Atomically create up to 100 records of one type.", inputSchema: { type: recordTypeSchema, items: z.array(z.record(z.string(), z.unknown())).min(1).max(100) } }, async ({ type, items }) => {
    const validated = items.map((item) => prepareRecord(type, item)); return result({ items: sqlite.transaction(() => validated.map((item) => insertRecord(type, item)))() });
  });
  server.registerTool("bulk_update_records", { description: "Atomically update up to 100 records.", inputSchema: { type: recordTypeSchema, items: z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).min(1).max(100) } }, async ({ type, items }) => result({ items: sqlite.transaction(() => items.map((item) => updateRecord(type, item.id, item.patch)))() }));
  server.registerTool("bulk_create_tasks", { description: "Atomically create up to 100 tasks.", inputSchema: { items: z.array(taskInput).min(1).max(100) } }, async ({ items }) => result({ items: sqlite.transaction(() => items.map(insertTask))() }));
  server.registerTool("bulk_update_tasks", { description: "Atomically update up to 100 tasks.", inputSchema: { items: z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).min(1).max(100) } }, async ({ items }) => result({ items: sqlite.transaction(() => items.map((item) => updateTask(item.id, item.patch)))() }));

  server.registerTool("preview_bulk_operation", {
    description: "Validate a batch write and return a signed preview token. Use this before execute_bulk_operation for AI-assisted batch changes.",
    inputSchema: { operation: bulkOperationSchema, type: recordTypeSchema.optional(), items: z.array(z.record(z.string(), z.unknown())).min(1).max(100) },
  }, async ({ operation, type, items }) => {
    const payload: Record<string, unknown> = { items, ...(type ? { type } : {}) };
    if ((operation === "create_records" || operation === "update_records") && !type) throw new Error("type is required for record operations");
    // Run validation without committing.
    if (operation === "create_records") items.forEach((item) => prepareRecord(type!, item));
    if (operation === "update_records") z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).parse(items);
    if (operation === "create_tasks") z.array(taskInput).parse(items);
    if (operation === "update_tasks") z.array(z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.unknown()) })).parse(items);
    return result({ operation, count: items.length, preview: items.slice(0, 20), previewToken: makePreviewToken(operation, payload) });
  });

  server.registerTool("execute_bulk_operation", {
    description: "Execute a previously previewed signed batch operation.",
    inputSchema: { previewToken: z.string().min(20) },
  }, async ({ previewToken }) => {
    const preview = readPreviewToken(previewToken); return result({ operation: preview.operation, ...executeBulk(preview.operation, preview.payload) });
  });

  server.registerTool("link_records", {
    description: "Create a semantic link between two existing records or tasks.",
    inputSchema: { sourceType: z.string().max(30), sourceId: z.string().uuid(), targetType: z.string().max(30), targetId: z.string().uuid(), relation: z.string().trim().min(1).max(60).default("related") },
  }, async ({ sourceType, sourceId, targetType, targetId, relation }) => {
    if (sourceType === targetType && sourceId === targetId) throw new Error("A record cannot link to itself");
    if (!recordExists(sourceType, sourceId) || !recordExists(targetType, targetId)) throw new Error("Source or target record does not exist");
    const id = crypto.randomUUID();
    sqlite.prepare("INSERT INTO research_links (id,source_type,source_id,target_type,target_id,relation,created_at) VALUES (?,?,?,?,?,?,?)").run(id, sourceType, sourceId, targetType, targetId, relation, nowIso());
    return result({ id, sourceType, sourceId, targetType, targetId, relation });
  });

  return server;
}
