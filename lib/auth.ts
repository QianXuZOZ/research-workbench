import argon2 from "argon2";
import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { sqlite } from "@/lib/db";
import { nowIso } from "@/lib/utils";

const COOKIE_NAME = "workbench_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type SessionUser = { id: string; email: string; mustChangePassword: boolean; csrfToken: string; expiresAt: string };

export async function ensureAdmin() {
  const existing = sqlite.prepare("SELECT id FROM admins LIMIT 1").get() as { id: string } | undefined;
  if (existing) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email || !password || password.length < 12) return;
  const now = nowIso();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  sqlite.prepare("INSERT INTO admins (id, email, password_hash, must_change_password, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)")
    .run(randomUUID(), email, passwordHash, now, now);
}

export function adminConfigured() {
  return Boolean(sqlite.prepare("SELECT 1 AS ok FROM admins LIMIT 1").get());
}

export async function authenticate(email: string, password: string) {
  await ensureAdmin();
  const admin = sqlite.prepare("SELECT * FROM admins WHERE lower(email) = lower(?) LIMIT 1").get(email) as Record<string, unknown> | undefined;
  if (!admin) return null;
  const ok = await argon2.verify(String(admin.password_hash), password);
  return ok ? admin : null;
}

export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = randomBytes(24).toString("base64url");
  const now = new Date();
  const ttlHours = Math.max(1, Number(process.env.SESSION_TTL_HOURS ?? 12));
  const expires = new Date(now.getTime() + ttlHours * 3600_000);
  sqlite.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString());
  sqlite.prepare("INSERT INTO sessions (id, admin_id, token_hash, csrf_token, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(randomUUID(), adminId, hashToken(token), csrfToken, expires.toISOString(), now.toISOString(), now.toISOString());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE !== "false",
    path: "/",
    expires,
  });
  return csrfToken;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = sqlite.prepare(`SELECT a.id, a.email, a.must_change_password, s.csrf_token, s.expires_at, s.last_seen_at, s.id AS session_id
    FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ? LIMIT 1`).get(hashToken(token)) as Record<string, unknown> | undefined;
  if (!row || new Date(String(row.expires_at)).getTime() <= Date.now()) {
    if (row) sqlite.prepare("DELETE FROM sessions WHERE id = ?").run(row.session_id);
    return null;
  }
  const lastSeen = new Date(String(row.last_seen_at)).getTime();
  if (!Number.isFinite(lastSeen) || Date.now() - lastSeen > 5 * 60_000) {
    sqlite.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(nowIso(), row.session_id);
  }
  return {
    id: String(row.id),
    email: String(row.email),
    mustChangePassword: Boolean(row.must_change_password),
    csrfToken: String(row.csrf_token),
    expiresAt: String(row.expires_at),
  };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) sqlite.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.COOKIE_SECURE !== "false", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function changePassword(adminId: string, currentPassword: string, nextPassword: string) {
  const admin = sqlite.prepare("SELECT password_hash FROM admins WHERE id = ?").get(adminId) as { password_hash: string } | undefined;
  if (!admin || !(await argon2.verify(admin.password_hash, currentPassword))) return false;
  const hash = await argon2.hash(nextPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  sqlite.transaction(() => {
    sqlite.prepare("UPDATE admins SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?").run(hash, nowIso(), adminId);
    sqlite.prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
  })();
  return true;
}

export function secureCompare(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
