import { NextRequest } from "next/server";
import { getSession, secureCompare } from "@/lib/auth";
import { createAuthorizationCode, oauthErrorRedirect, oauthSuccessRedirect, parseAuthorizationRequest, validateClientMetadata } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toParams(form: FormData) {
  const params = new URLSearchParams();
  for (const key of ["response_type","client_id","redirect_uri","code_challenge","code_challenge_method","resource","scope","state"]) {
    const value = form.get(key);
    if (typeof value === "string" && value) params.set(key, value);
  }
  return params;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "login_required" }, { status: 401 });

  const form = await request.formData();
  const csrf = typeof form.get("csrf") === "string" ? String(form.get("csrf")) : "";
  if (!csrf || !secureCompare(csrf, session.csrfToken)) return Response.json({ error: "invalid_csrf" }, { status: 403 });

  let authRequest;
  try {
    authRequest = parseAuthorizationRequest(toParams(form));
    await validateClientMetadata(authRequest.clientId, authRequest.redirectUri);
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const decision = form.get("decision");
  if (decision !== "allow") {
    return Response.redirect(oauthErrorRedirect(authRequest, "access_denied", "The user denied the authorization request."), 303);
  }

  const code = createAuthorizationCode(session.id, authRequest);
  return Response.redirect(oauthSuccessRedirect(authRequest, code), 303);
}
