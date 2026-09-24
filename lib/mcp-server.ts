import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { fromDatabase, isRecordType, recordLabels, recordSchemas, recordTables, toDatabase, type RecordType } from "@/lib/records";
import { updateSearchIndex } from "@/lib/search";
import { calendarDateInTimeZone, normalizeDoi, nowIso } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const recordTypeSchema = z.enum(["projects", "papers", "literature", "patents", "growth"]);
const taskStatusSchema = z.enum(["todo", "doing", "done", "blocked"]);
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

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
  const id = crypto.randomUUID();
  const now = nowIso();
  const values = toDatabase(type, data);
  const columns = ["id", ...Object.keys(values), "created_at", "updated_at"];
  sqlite.prepare(`INSERT INTO ${recordTables[type]} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
    .run(id, ...Object.values(values), now, now);
  updateSearchIndex(type, id, String(data.title), Object.values(data).filter((value) => typeof value === "string").join(" "));
  logActivity("create", `MCP 新建${recordLabels[type]}：${data.title}`, type, id);
  return fromDatabase(type, sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown>);
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
    const parent = sqlite.prepare(`SELECT 1 FROM ${recordTables[data.entityType]} WHERE id = ? AND archived_at IS NULL`).get(data.entityId);
    if (!parent) throw new Error("Linked parent record does not exist");
  }
  const id = crypto.randomUUID();
  const now = nowIso();
  const completedAt = data.status === "done" ? now : null;
  sqlite.prepare(`INSERT INTO tasks (id,title,kind,status,priority,due_at,start_at,completed_at,progress,entity_type,entity_id,notes,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, data.title, data.kind, data.status, data.priority, data.dueAt || null, data.startAt || null, completedAt,
      data.status === "done" ? 100 : data.progress, data.entityType || null, data.entityId || null, data.notes || null, now, now
    );
  updateSearchIndex("tasks", id, data.title, data.notes ?? "");
  logActivity("create", `MCP 新建${data.kind === "milestone" ? "里程碑" : "任务"}：${data.title}`, "tasks", id);
  return sqlite.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>;
}

function recordExists(type: string, id: string) {
  if (isRecordType(type)) return Boolean(sqlite.prepare(`SELECT 1 FROM ${recordTables[type]} WHERE id = ?`).get(id));
  if (type === "tasks") return Boolean(sqlite.prepare("SELECT 1 FROM tasks WHERE id = ?").get(id));
  return false;
}

export function buildResearchMcpServer() {
  const server = new McpServer(
    { name: "research-workbench", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.registerTool("search_records", {
    description: "Search projects, publication outputs, literature, patents, growth records, and tasks by title or keyword.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(120), limit: z.number().int().min(1).max(50).default(20) }),
  }, async ({ query, limit }) => {
    const terms = query.split(/\s+/).filter(Boolean);
    const hasShortTerm = terms.some((term) => Array.from(term).length < 3);
    const items = hasShortTerm
      ? sqlite.prepare("SELECT entity_type AS entityType, entity_id AS entityId, title, substr(body,1,300) AS snippet FROM search_index WHERE title LIKE ? OR body LIKE ? LIMIT ?").all(`%${query}%`, `%${query}%`, limit)
      : sqlite.prepare("SELECT entity_type AS entityType, entity_id AS entityId, title, snippet(search_index,3,'','','…',24) AS snippet FROM search_index WHERE search_index MATCH ? LIMIT ?").all(terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(" AND "), limit);
    return result({ count: items.length, items });
  });

  server.registerTool("get_record", {
    description: "Get one research record with its linked tasks, attachments metadata, and research links.",
    inputSchema: z.object({ type: recordTypeSchema, id: z.string().uuid() }),
  }, async ({ type, id }) => {
    const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
    if (!row) throw new Error("Record not found");
    const tasks = sqlite.prepare("SELECT * FROM tasks WHERE entity_type=? AND entity_id=? AND archived_at IS NULL ORDER BY due_at IS NULL,due_at").all(type, id);
    const attachments = sqlite.prepare("SELECT id,original_name AS originalName,mime_type AS mimeType,size,label,created_at AS createdAt FROM attachments WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC").all(type, id);
    const links = sqlite.prepare("SELECT * FROM research_links WHERE (source_type=? AND source_id=?) OR (target_type=? AND target_id=?) ORDER BY created_at DESC").all(type, id, type, id);
    return result({ item: fromDatabase(type, row), tasks, attachments, links });
  });

  server.registerTool("list_tasks", {
    description: "List active research tasks with optional status, parent record, and due-date filters.",
    inputSchema: z.object({
      status: taskStatusSchema.optional(),
      entityType: z.string().max(30).optional(),
      entityId: z.string().uuid().optional(),
      dueBefore: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
    }),
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

  server.registerTool("create_task", {
    description: "Create one task or milestone. Optionally link it to a project or another research record.",
    inputSchema: taskInput,
  }, async (input) => result({ item: insertTask(input) }));

  server.registerTool("bulk_create_tasks", {
    description: "Atomically create up to 100 tasks or milestones. If any item is invalid or fails, none are committed.",
    inputSchema: z.object({ items: z.array(taskInput).min(1).max(100) }),
  }, async ({ items }) => {
    const validated = items.map((item) => taskInput.parse(item));
    const created = sqlite.transaction(() => validated.map((item) => insertTask(item)))();
    return result({ created: created.length, items: created });
  });

  server.registerTool("create_record", {
    description: "Create one project, publication output, literature item, patent, or growth record.",
    inputSchema: z.object({ type: recordTypeSchema, data: z.record(z.string(), z.unknown()) }),
  }, async ({ type, data }) => {
    try {
      return result({ item: insertRecord(type, prepareRecord(type, data)) });
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new Error("Duplicate code, DOI, application number, or other unique field");
      throw error;
    }
  });

  server.registerTool("bulk_create_records", {
    description: "Atomically create up to 100 records of one type. Intended for AI-assisted batch entry.",
    inputSchema: z.object({ type: recordTypeSchema, items: z.array(z.record(z.string(), z.unknown())).min(1).max(100) }),
  }, async ({ type, items }) => {
    const validated = items.map((item) => prepareRecord(type, item));
    try {
      const created = sqlite.transaction(() => validated.map((item) => insertRecord(type, item)))();
      return result({ created: created.length, items: created });
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new Error("Batch aborted because a unique field is duplicated");
      throw error;
    }
  });

  server.registerTool("link_records", {
    description: "Create a semantic link between two existing research records or tasks.",
    inputSchema: z.object({
      sourceType: z.string().max(30), sourceId: z.string().uuid(),
      targetType: z.string().max(30), targetId: z.string().uuid(),
      relation: z.string().trim().min(1).max(60).default("related"),
    }),
  }, async ({ sourceType, sourceId, targetType, targetId, relation }) => {
    if (sourceType === targetType && sourceId === targetId) throw new Error("A record cannot link to itself");
    if (!recordExists(sourceType, sourceId) || !recordExists(targetType, targetId)) throw new Error("Source or target record does not exist");
    const id = crypto.randomUUID();
    try {
      sqlite.prepare("INSERT INTO research_links (id,source_type,source_id,target_type,target_id,relation,created_at) VALUES (?,?,?,?,?,?,?)")
        .run(id, sourceType, sourceId, targetType, targetId, relation, nowIso());
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new Error("This link already exists");
      throw error;
    }
    return result({ id, sourceType, sourceId, targetType, targetId, relation });
  });

  return server;
}
