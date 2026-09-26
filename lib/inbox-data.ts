import { sqlite } from "@/lib/db";

export type InboxItem = Record<string, unknown> & {
  id: string;
  title: string;
  status: string;
  kind: string;
  created_at: string;
};

export function listInboxItems(status="inbox", query="", limit=200) {
  const where=["archived_at IS NULL","status=?"]; const values:unknown[]=[status];
  if(query.trim()) { const q="%" + query.trim() + "%"; where.push("(title LIKE ? OR body LIKE ? OR source_url LIKE ?)"); values.push(q,q,q); }
  return sqlite.prepare("SELECT * FROM inbox_items WHERE " + where.join(" AND ") + " ORDER BY created_at DESC LIMIT ?").all(...values,limit) as InboxItem[];
}
