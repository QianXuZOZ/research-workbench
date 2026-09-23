import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ items: [] });
  const terms = q.split(/\s+/).filter(Boolean);
  const hasShortTerm = terms.some((term) => Array.from(term).length < 3);
  const items = hasShortTerm
    ? sqlite.prepare("SELECT entity_type AS entityType, entity_id AS entityId, title, substr(body, 1, 180) AS snippet FROM search_index WHERE title LIKE ? OR body LIKE ? LIMIT 20").all(`%${q}%`, `%${q}%`)
    : sqlite.prepare("SELECT entity_type AS entityType, entity_id AS entityId, title, snippet(search_index, 3, '<mark>', '</mark>', '…', 16) AS snippet FROM search_index WHERE search_index MATCH ? LIMIT 20").all(terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(" AND "));
  return Response.json({ items });
}
