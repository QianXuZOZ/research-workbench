import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { fromDatabase, isRecordType, recordLabels, recordSchemas, recordTables, toDatabase } from "@/lib/records";
import { requireApiSession } from "@/lib/security";
import { calendarDateInTimeZone, normalizeDoi, nowIso, jsonError } from "@/lib/utils";
import { updateSearchIndex } from "@/lib/search";
import { listRecordItems } from "@/lib/record-data";

export async function GET(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;
  const { type } = await context.params;
  if (!isRecordType(type)) return jsonError("未知记录类型", 404, "NOT_FOUND");
  const params = request.nextUrl.searchParams;
  const items = listRecordItems(type, {
    query: params.get("q")?.trim() ?? "",
    status: params.get("status")?.trim() ?? "",
    archived: params.get("archived") === "true",
    limit: Math.min(200, Math.max(1, Number(params.get("limit") ?? 100))),
  });
  return Response.json({ items, count: items.length });
}

export async function POST(request: NextRequest, context: { params: Promise<{ type: string }> }) {
  const auth = await requireApiSession(request);
  if ("response" in auth) return auth.response;
  const { type } = await context.params;
  if (!isRecordType(type)) return jsonError("未知记录类型", 404, "NOT_FOUND");
  const parsed = recordSchemas[type].safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请检查填写内容", 400, "VALIDATION_ERROR", Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message])));
  const id = crypto.randomUUID();
  const now = nowIso();
  const data = { ...parsed.data } as Record<string, unknown>;
  if (type === "papers" || type === "literature") data.doi = normalizeDoi(String(data.doi ?? ""));
  if (type === "projects" && data.status === "completed" && !data.completedAt) data.completedAt = calendarDateInTimeZone();
  const values = toDatabase(type, data);
  const columns = ["id", ...Object.keys(values), "created_at", "updated_at"];
  try {
    sqlite.prepare(`INSERT INTO ${recordTables[type]} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(id, ...Object.values(values), now, now);
  } catch (error) {
    if (String(error).includes("UNIQUE")) return jsonError("编号或 DOI 已存在", 409, "DUPLICATE");
    throw error;
  }
  const body = Object.values(data).filter((value) => typeof value === "string").join(" ");
  updateSearchIndex(type, id, String(data.title), body);
  logActivity("create", `新建${recordLabels[type]}：${data.title}`, type, id);
  const row = sqlite.prepare(`SELECT * FROM ${recordTables[type]} WHERE id = ?`).get(id) as Record<string, unknown>;
  return Response.json({ item: fromDatabase(type, row) }, { status: 201 });
}
