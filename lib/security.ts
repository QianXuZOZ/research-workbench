import type { NextRequest } from "next/server";
import { getSession, secureCompare } from "@/lib/auth";
import { jsonError } from "@/lib/utils";

export async function requireApiSession(request?: NextRequest) {
  const session = await getSession();
  if (!session) return { response: jsonError("请先登录", 401, "UNAUTHORIZED") } as const;
  if (request && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const trusted = process.env.TRUSTED_ORIGIN;
    if (trusted && origin && origin !== trusted) return { response: jsonError("请求来源不受信任", 403, "ORIGIN_REJECTED") } as const;
    const csrf = request.headers.get("x-csrf-token") ?? "";
    if (!secureCompare(csrf, session.csrfToken)) return { response: jsonError("页面校验已失效，请刷新后重试", 403, "CSRF_REJECTED") } as const;
  }
  return { session } as const;
}

export function clientKey(request: NextRequest, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${forwarded ?? "local"}:${email.toLowerCase()}`;
}
