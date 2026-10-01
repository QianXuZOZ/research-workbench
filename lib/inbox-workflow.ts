import { z } from "zod";
import { sqlite } from "@/lib/db";
import { nowIso } from "@/lib/utils";
import { createQuickCapture } from "@/lib/quick-capture";
import { logActivity } from "@/lib/activity";

export const inboxTargetSchema = z.enum(["task","question","finding","literature"]);
export type InboxTarget = z.infer<typeof inboxTargetSchema>;

export function processInboxItem(id: string, targetType: InboxTarget, actor: "web" | "mcp" = "web") {
  const item = sqlite.prepare("SELECT * FROM inbox_items WHERE id=? AND archived_at IS NULL").get(id) as Record<string,unknown> | undefined;
  if (!item) throw new Error("INBOX_NOT_FOUND");
  if (item.status === "processed") throw new Error("ALREADY_PROCESSED");

  const created = createQuickCapture({
    type: targetType,
    title: String(item.title),
    notes: item.body ? String(item.body) : null,
    url: item.source_url ? String(item.source_url) : null,
  }, actor);
  const now = nowIso();
  sqlite.prepare("UPDATE inbox_items SET status='processed',target_type=?,target_id=?,processed_at=?,updated_at=? WHERE id=?")
    .run(targetType, created.id, now, now, id);
  logActivity("update", `${actor === "mcp" ? "MCP " : ""}整理 Inbox：${String(item.title)} → ${targetType}`, "inbox", id);
  return { ok: true, inboxId: id, targetType: created.type, targetId: created.id };
}
