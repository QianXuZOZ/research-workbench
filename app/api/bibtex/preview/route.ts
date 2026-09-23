import { NextRequest } from "next/server";
import { parseBibtex, bibtexIdentity } from "@/lib/bibtex";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, normalizeTitle } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { bibtex?: string } | null;
  if (!body?.bibtex || body.bibtex.length > 5_000_000) return jsonError("BibTeX 内容为空或超过 5 MB", 400, "VALIDATION_ERROR");
  const entries = parseBibtex(body.bibtex);
  if (!entries.length) return jsonError("没有识别到有效的 BibTeX 条目", 400, "BIBTEX_PARSE_ERROR");
  const existing = sqlite.prepare("SELECT id,title,year,doi FROM papers WHERE archived_at IS NULL").all() as { id: string; title: string; year: number | null; doi: string | null }[];
  const identities = new Map(existing.map((paper) => [paper.doi ? `doi:${paper.doi.toLowerCase()}` : `title:${normalizeTitle(paper.title)}:${paper.year ?? ""}`, paper.id]));
  return Response.json({ items: entries.map((entry) => ({ ...entry, identity: bibtexIdentity(entry), duplicateId: identities.get(bibtexIdentity(entry)) ?? null })) });
}
