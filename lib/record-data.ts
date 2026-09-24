import { sqlite } from "@/lib/db";
import { fromDatabase, isRecordType, recordTables, type RecordType } from "@/lib/records";
import { listRevisions } from "@/lib/revisions";

export type RecordItem = Record<string, unknown> & { id: string; title: string };

export type RecordDetailData = {
  item: Record<string, unknown>;
  tasks: Record<string, unknown>[];
  revisions: { id: string; actor: string; snapshot: string; createdAt: string }[];
  attachments: { id: string; originalName: string; mimeType: string; size: number; label: string | null; createdAt: string }[];
  links: Record<string, unknown>[];
};

const relationFields: Partial<Record<RecordType, Record<string, RecordType>>> = {
  questions: { projectId: "projects" },
  hypotheses: { projectId: "projects", questionId: "questions" },
  experiments: { projectId: "projects", hypothesisId: "hypotheses" },
  runs: { experimentId: "experiments" },
  findings: { projectId: "projects", experimentId: "experiments", runId: "runs" },
  artifacts: { projectId: "projects", experimentId: "experiments", runId: "runs" },
};

function attachRelationTitles(type: RecordType, items: RecordItem[]) {
  const fields = relationFields[type];
  if (!fields || !items.length) return items;

  const titleMaps = new Map<string, Map<string, string>>();
  for (const [field, targetType] of Object.entries(fields)) {
    const ids = [...new Set(items.map((item) => item[field]).filter(Boolean).map(String))];
    if (!ids.length) continue;
    const rows = sqlite.prepare(`SELECT id,title FROM ${recordTables[targetType]} WHERE id IN (${ids.map(() => "?").join(",")})`)
      .all(...ids) as { id: string; title: string }[];
    titleMaps.set(field, new Map(rows.map((row) => [row.id, row.title])));
  }

  return items.map((item) => {
    const next = { ...item };
    for (const field of Object.keys(fields)) {
      const id = item[field];
      if (id) next[`${field}Title`] = titleMaps.get(field)?.get(String(id)) ?? null;
    }
    return next;
  });
}

export function listRecordItems(type: RecordType, options: { query?: string; status?: string; archived?: boolean; limit?: number } = {}) {
  const query = options.query?.trim() ?? "";
  const status = options.status?.trim() ?? "";
  const archived = options.archived ?? false;
  const limit = Math.min(200, Math.max(1, options.limit ?? 100));
  const where: string[] = [archived ? "archived_at IS NOT NULL" : "archived_at IS NULL"];
  const values: unknown[] = [];

  if (query) {
    where.push("(title LIKE ? OR COALESCE(notes, '') LIKE ? OR COALESCE(keywords, '') LIKE ?)");
    values.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }
  if (status && type !== "artifacts") {
    where.push("status = ?");
    values.push(status);
  }
  values.push(limit);

  const rows = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE ${where.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`)
    .all(...values) as Record<string, unknown>[];

  return attachRelationTitles(type, rows.map((row) => fromDatabase(type, row) as RecordItem));
}

function titleMapForLinks(rawLinks: Record<string, unknown>[], currentType: RecordType, currentId: string) {
  const idsByType = new Map<RecordType, Set<string>>();

  for (const link of rawLinks) {
    const otherType = link.source_type === currentType && link.source_id === currentId ? String(link.target_type) : String(link.source_type);
    const otherId = link.source_type === currentType && link.source_id === currentId ? String(link.target_id) : String(link.source_id);
    if (!isRecordType(otherType)) continue;
    if (!idsByType.has(otherType)) idsByType.set(otherType, new Set());
    idsByType.get(otherType)!.add(otherId);
  }

  const titles = new Map<string, string>();
  for (const [type, ids] of idsByType) {
    const list = [...ids];
    if (!list.length) continue;
    const rows = sqlite.prepare(`SELECT id,title FROM ${recordTables[type]} WHERE id IN (${list.map(() => "?").join(",")})`)
      .all(...list) as { id: string; title: string }[];
    for (const row of rows) titles.set(`${type}:${row.id}`, row.title);
  }
  return titles;
}

export function getRecordDetailData(type: RecordType, id: string): RecordDetailData | null {
  const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const tasks = sqlite.prepare("SELECT * FROM tasks WHERE entity_type = ? AND entity_id = ? AND archived_at IS NULL ORDER BY due_at IS NULL, due_at")
    .all(type, id) as Record<string, unknown>[];
  const attachments = sqlite.prepare("SELECT id, original_name AS originalName, mime_type AS mimeType, size, label, created_at AS createdAt FROM attachments WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC")
    .all(type, id) as RecordDetailData["attachments"];
  const rawLinks = sqlite.prepare("SELECT * FROM research_links WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?) ORDER BY created_at DESC")
    .all(type, id, type, id) as Record<string, unknown>[];
  const titles = titleMapForLinks(rawLinks, type, id);
  const links = rawLinks.map((link) => {
    const otherType = link.source_type === type && link.source_id === id ? String(link.target_type) : String(link.source_type);
    const otherId = link.source_type === type && link.source_id === id ? String(link.target_id) : String(link.source_id);
    return { ...link, otherType, otherId, otherTitle: titles.get(`${otherType}:${otherId}`) ?? "记录已删除" };
  });

  return {
    item: fromDatabase(type, row),
    tasks,
    attachments,
    links,
    revisions: listRevisions(type, id, 20) as RecordDetailData["revisions"],
  };
}
