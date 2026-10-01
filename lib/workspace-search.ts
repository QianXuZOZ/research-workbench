import { sqlite } from "@/lib/db";

export type WorkspaceSearchItem = {
  entityType: string;
  entityId: string;
  title: string;
  snippet: string;
};

function searchIndexed(query: string, limit: number) {
  const terms = query.split(/\s+/).filter(Boolean);
  const hasShortTerm = terms.some((term) => Array.from(term).length < 3);
  return (hasShortTerm
    ? sqlite.prepare("SELECT entity_type AS entityType,entity_id AS entityId,title,substr(body,1,300) AS snippet FROM search_index WHERE title LIKE ? OR body LIKE ? LIMIT ?").all(`%${query}%`, `%${query}%`, limit)
    : sqlite.prepare("SELECT entity_type AS entityType,entity_id AS entityId,title,snippet(search_index,3,'','','…',24) AS snippet FROM search_index WHERE search_index MATCH ? LIMIT ?").all(terms.map((term) => `"${term.replaceAll('"','""')}"*`).join(" AND "), limit)
  ) as WorkspaceSearchItem[];
}

export function searchWorkspace(query: string, limit=20) {
  const q = query.trim();
  if (q.length < 2) return [] as WorkspaceSearchItem[];
  const safeLimit = Math.min(50, Math.max(1, limit));
  const indexed = searchIndexed(q, safeLimit);
  const like = `%${q}%`;
  const inbox = sqlite.prepare(`SELECT 'inbox' AS entityType,id AS entityId,title,substr(COALESCE(body,'') || ' ' || COALESCE(source_url,''),1,300) AS snippet
    FROM inbox_items WHERE archived_at IS NULL AND (title LIKE ? OR COALESCE(body,'') LIKE ? OR COALESCE(source_url,'') LIKE ?)
    ORDER BY updated_at DESC LIMIT ?`).all(like,like,like,safeLimit) as WorkspaceSearchItem[];
  const reviews = sqlite.prepare(`SELECT 'reviews' AS entityType,id AS entityId,
    '周复盘 ' || period_start || ' — ' || period_end AS title,
    substr(COALESCE(reflection,'') || ' ' || COALESCE(next_focus,''),1,300) AS snippet
    FROM weekly_reviews WHERE COALESCE(reflection,'') LIKE ? OR COALESCE(next_focus,'') LIKE ?
    ORDER BY updated_at DESC LIMIT ?`).all(like,like,safeLimit) as WorkspaceSearchItem[];

  const seen = new Set<string>();
  const merged: WorkspaceSearchItem[] = [];
  for (const item of [...indexed,...inbox,...reviews]) {
    const key = `${item.entityType}:${item.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key); merged.push(item);
    if (merged.length >= safeLimit) break;
  }
  return merged;
}
