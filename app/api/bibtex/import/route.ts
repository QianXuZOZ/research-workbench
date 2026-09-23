import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso, normalizeDoi, normalizeTitle } from "@/lib/utils";
import { updateSearchIndex } from "@/lib/search";
import { logActivity } from "@/lib/activity";

const itemSchema = z.object({ title: z.string().min(1).max(500), authors: z.string().max(5000).optional().default(""), venue: z.string().max(500).optional().default(""), year: z.number().int().nullable(), doi: z.string().nullable(), abstract: z.string().max(30000).optional().default(""), keywords: z.string().max(5000).optional().default(""), raw: z.string().max(100000).optional().default("") });
const schema = z.object({ items: z.array(itemSchema).min(1).max(2000), duplicateStrategy: z.enum(["skip", "merge"]).default("skip") });

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("导入内容无效", 400, "VALIDATION_ERROR");
  let created = 0; let updated = 0; let skipped = 0;
  const existing = sqlite.prepare("SELECT id,title,year,doi FROM literature_items").all() as { id: string; title: string; year: number | null; doi: string | null }[];
  const identities = new Map(existing.map((item) => [item.doi ? `doi:${item.doi.toLowerCase()}` : `title:${normalizeTitle(item.title)}:${item.year ?? ""}`, item.id]));
  sqlite.transaction(() => {
    for (const item of parsed.data.items) {
      const doi = normalizeDoi(item.doi);
      const identity = doi ? `doi:${doi}` : `title:${normalizeTitle(item.title)}:${item.year ?? ""}`;
      const duplicateId = identities.get(identity);
      const now = nowIso();
      if (duplicateId && parsed.data.duplicateStrategy === "skip") { skipped += 1; continue; }
      if (duplicateId) {
        sqlite.prepare("UPDATE literature_items SET authors=?,venue=?,year=?,doi=?,abstract=?,keywords=?,bibtex=?,updated_at=? WHERE id=?")
          .run(item.authors || null, item.venue || null, item.year, doi, item.abstract || null, item.keywords || null, item.raw || null, now, duplicateId);
        updateSearchIndex("literature", duplicateId, item.title, `${item.authors} ${item.venue} ${item.abstract} ${item.keywords}`); updated += 1;
      } else {
        const id = crypto.randomUUID();
        sqlite.prepare("INSERT INTO literature_items (id,title,authors,venue,venue_type,status,year,doi,abstract,keywords,bibtex,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
          .run(id, item.title, item.authors || null, item.venue || null, "journal", "unread", item.year, doi, item.abstract || null, item.keywords || null, item.raw || null, now, now);
        updateSearchIndex("literature", id, item.title, `${item.authors} ${item.venue} ${item.abstract} ${item.keywords}`); identities.set(identity, id); created += 1;
      }
    }
  })();
  logActivity("import", `BibTeX 导入文献完成：新增 ${created}，更新 ${updated}，跳过 ${skipped}`, "literature");
  return Response.json({ created, updated, skipped });
}
