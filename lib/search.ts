import { sqlite } from "@/lib/db";

export function updateSearchIndex(entityType: string, entityId: string, title: string, body: string) {
  const remove = sqlite.prepare("DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?");
  const insert = sqlite.prepare("INSERT INTO search_index (entity_type, entity_id, title, body) VALUES (?, ?, ?, ?)");
  sqlite.transaction(() => {
    remove.run(entityType, entityId);
    insert.run(entityType, entityId, title, body);
  })();
}

export function deleteSearchIndex(entityType: string, entityId: string) {
  sqlite.prepare("DELETE FROM search_index WHERE entity_type = ? AND entity_id = ?").run(entityType, entityId);
}
