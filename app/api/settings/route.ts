import { NextRequest } from "next/server";
import { z } from "zod";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const defaults = { displayName: "研究者", institution: "", researchDirection: "电力系统", timezone: process.env.APP_TIMEZONE ?? "Asia/Hong_Kong", themePreset: "codex", themeMode: "system", themeOverrides: "{}" };

export async function GET() {
  const auth = await requireApiSession(); if ("response" in auth) return auth.response;
  const rows = sqlite.prepare("SELECT key,value FROM settings").all() as { key: string; value: string }[];
  return Response.json({ settings: { ...defaults, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) }, user: { email: auth.session.email, mustChangePassword: auth.session.mustChangePassword } });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiSession(request); if ("response" in auth) return auth.response;
  const schema = z.object({ displayName: z.string().trim().max(100), institution: z.string().trim().max(200), researchDirection: z.string().trim().max(200), timezone: z.string().trim().max(100), themePreset: z.enum(["codex","github","gruvbox","catppuccin","everforest","linear","notion","one","nord","tokyo-night","solarized"]), themeMode: z.enum(["light","dark","system"]), themeOverrides: z.string().max(3000) }).partial().refine((value) => Object.keys(value).length > 0, "至少需要一个设置项");
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError("设置内容无效", 400, "VALIDATION_ERROR");
  const statement = sqlite.prepare("INSERT INTO settings (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at");
  sqlite.transaction(() => { for (const [key, value] of Object.entries(parsed.data)) statement.run(key, value, nowIso()); })();
  return Response.json({ ok: true });
}
