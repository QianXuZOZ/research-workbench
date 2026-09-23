import { normalizeDoi, normalizeTitle } from "@/lib/utils";

export type BibEntry = {
  key: string;
  type: string;
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  doi: string | null;
  abstract: string;
  keywords: string;
  raw: string;
};

function unwrap(value: string) {
  const trimmed = value.trim().replace(/,$/, "").trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function splitFields(input: string) {
  const fields: string[] = [];
  let start = 0; let depth = 0; let quote = false; let escaped = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === '"' && depth === 0) quote = !quote;
    if (!quote) {
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      if (char === "," && depth === 0) { fields.push(input.slice(start, i)); start = i + 1; }
    }
  }
  fields.push(input.slice(start));
  return fields;
}

export function parseBibtex(source: string): BibEntry[] {
  const entries: BibEntry[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    const at = source.indexOf("@", cursor);
    if (at < 0) break;
    const header = source.slice(at).match(/^@([a-zA-Z]+)\s*([({])/);
    if (!header) { cursor = at + 1; continue; }
    const open = header[2]; const close = open === "{" ? "}" : ")";
    const bodyStart = at + header[0].length;
    let depth = 1; let quote = false; let escaped = false; let end = bodyStart;
    for (; end < source.length; end += 1) {
      const char = source[end];
      if (escaped) { escaped = false; continue; }
      if (char === "\\") { escaped = true; continue; }
      if (char === '"') quote = !quote;
      if (!quote) { if (char === open) depth += 1; if (char === close) depth -= 1; if (depth === 0) break; }
    }
    if (depth !== 0) break;
    const raw = source.slice(at, end + 1);
    const body = source.slice(bodyStart, end);
    const comma = body.indexOf(",");
    if (comma > 0) {
      const key = body.slice(0, comma).trim();
      const values: Record<string, string> = {};
      for (const field of splitFields(body.slice(comma + 1))) {
        const equals = field.indexOf("=");
        if (equals > 0) values[field.slice(0, equals).trim().toLowerCase()] = unwrap(field.slice(equals + 1)).replace(/[{}]/g, "");
      }
      const title = values.title?.trim();
      if (title) entries.push({
        key, type: header[1].toLowerCase(), title,
        authors: values.author?.replace(/\s+and\s+/gi, "; ") ?? "",
        venue: values.journal ?? values.booktitle ?? values.publisher ?? "",
        year: values.year && /^\d{4}$/.test(values.year) ? Number(values.year) : null,
        doi: normalizeDoi(values.doi), abstract: values.abstract ?? "", keywords: values.keywords ?? "", raw,
      });
    }
    cursor = end + 1;
  }
  return entries;
}

export function bibtexIdentity(entry: Pick<BibEntry, "doi" | "title" | "year">) {
  return entry.doi ? `doi:${normalizeDoi(entry.doi)}` : `title:${normalizeTitle(entry.title)}:${entry.year ?? ""}`;
}
