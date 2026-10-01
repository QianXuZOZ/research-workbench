import { NextRequest } from "next/server";
import { exchangeAuthorizationCode, mcpResource, oauthTokenResponseError, rotateRefreshToken } from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader) return oauthTokenResponseError("invalid_client", "This OAuth client uses public-client PKCE token exchange.", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return oauthTokenResponseError("invalid_request", "Expected form-encoded OAuth token request.");

  const grantType = field(form, "grant_type");
  const clientId = field(form, "client_id");
  const resource = field(form, "resource");
  if (!clientId) return oauthTokenResponseError("invalid_client", "client_id is required.");
  if (!resource || resource !== mcpResource()) return oauthTokenResponseError("invalid_target", "The resource parameter does not match this MCP server.");

  try {
    if (grantType === "authorization_code") {
      const code = field(form, "code");
      const redirectUri = field(form, "redirect_uri");
      const codeVerifier = field(form, "code_verifier");
      if (!code || !redirectUri || !codeVerifier) return oauthTokenResponseError("invalid_request", "code, redirect_uri, and code_verifier are required.");
      const payload = exchangeAuthorizationCode({ code, clientId, redirectUri, codeVerifier, resource });
      return Response.json(payload, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }
    if (grantType === "refresh_token") {
      const refreshToken = field(form, "refresh_token");
      if (!refreshToken) return oauthTokenResponseError("invalid_request", "refresh_token is required.");
      const payload = rotateRefreshToken({ refreshToken, clientId, resource });
      return Response.json(payload, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }
    return oauthTokenResponseError("unsupported_grant_type", "Only authorization_code and refresh_token are supported.");
  } catch (error) {
    const code = error instanceof Error ? error.message : "invalid_grant";
    if (code === "invalid_target") return oauthTokenResponseError("invalid_target", "Invalid MCP resource.");
    if (code === "invalid_client") return oauthTokenResponseError("invalid_client", "Invalid OAuth client.", 401);
    return oauthTokenResponseError("invalid_grant", "The authorization grant is invalid, expired, or already used.");
  }
}
