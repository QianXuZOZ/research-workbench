import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticate, createSession } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { clientKey } from "@/lib/security";
import { jsonError, nowIso } from "@/lib/utils";

const inputSchema = z.object({ email: z.email(), password: z.string().min(1).max(500) });

export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("请输入有效的邮箱和密码", 400, "VALIDATION_ERROR");
  const key = clientKey(request, parsed.data.email);
  const attempt = sqlite.prepare("SELECT * FROM login_attempts WHERE key = ?").get(key) as { failed_count: number; blocked_until: string | null } | undefined;
  if (attempt?.blocked_until && new Date(attempt.blocked_until).getTime() > Date.now()) {
    return jsonError("登录尝试过多，请稍后再试", 429, "LOGIN_THROTTLED");
  }
  const admin = await authenticate(parsed.data.email, parsed.data.password);
  if (!admin) {
    const count = (attempt?.failed_count ?? 0) + 1;
    const blockedUntil = count >= 5 ? new Date(Date.now() + Math.min(15, count - 4) * 60_000).toISOString() : null;
    sqlite.prepare(`INSERT INTO login_attempts (key, failed_count, blocked_until, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET failed_count = excluded.failed_count, blocked_until = excluded.blocked_until, updated_at = excluded.updated_at`)
      .run(key, count, blockedUntil, nowIso());
    return jsonError("邮箱或密码不正确", 401, "INVALID_CREDENTIALS");
  }
  sqlite.prepare("DELETE FROM login_attempts WHERE key = ?").run(key);
  const csrfToken = await createSession(String(admin.id));
  return Response.json({ user: { email: admin.email, mustChangePassword: Boolean(admin.must_change_password) }, csrfToken });
}
