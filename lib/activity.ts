import { sqlite } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export function logActivity(action: string, summary: string, entityType?: string, entityId?: string, details?: unknown) {
  sqlite.prepare("INSERT INTO activity_logs (id, action, entity_type, entity_id, summary, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(crypto.randomUUID(), action, entityType ?? null, entityId ?? null, summary, details ? JSON.stringify(details) : null, nowIso());
}
