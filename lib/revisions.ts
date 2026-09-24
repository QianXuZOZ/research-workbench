import { sqlite } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export function saveRevision(entityType: string, entityId: string, snapshot: unknown, actor = "user") {
  sqlite.prepare("INSERT INTO record_revisions (id,entity_type,entity_id,actor,snapshot,created_at) VALUES (?,?,?,?,?,?)")
    .run(crypto.randomUUID(), entityType, entityId, actor, JSON.stringify(snapshot), nowIso());
}

export function listRevisions(entityType: string, entityId: string, limit = 20) {
  return sqlite.prepare("SELECT id,actor,snapshot,created_at AS createdAt FROM record_revisions WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC LIMIT ?")
    .all(entityType, entityId, Math.min(100, Math.max(1, limit)));
}
