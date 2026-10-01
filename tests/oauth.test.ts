import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "research-workbench-oauth-"));
process.env.DATABASE_PATH = path.join(tempDir, "workbench.db");
process.env.UPLOAD_DIR = path.join(tempDir, "uploads");
process.env.MCP_PUBLIC_ORIGIN = "https://lab.example.test";
process.env.MCP_ACCESS_TOKEN = "s".repeat(48);

function challenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

describe("MCP OAuth 2.1 PKCE", () => {
  let adminId = "";

  beforeAll(async () => {
    fs.mkdirSync(process.env.UPLOAD_DIR!, { recursive: true });
    const { sqlite } = await import("../lib/db");
    adminId = crypto.randomUUID();
    const now = new Date().toISOString();
    sqlite.prepare("INSERT INTO admins (id,email,password_hash,must_change_password,created_at,updated_at) VALUES (?,?,?,0,?,?)")
      .run(adminId, "researcher@example.test", "unused-test-hash", now, now);
  });

  afterAll(async () => {
    const { sqlite } = await import("../lib/db");
    sqlite.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("publishes MCP OAuth metadata with PKCE S256 and CIMD", async () => {
    const { oauthAuthorizationServerMetadata, oauthProtectedResourceMetadata } = await import("../lib/oauth");
    const auth = oauthAuthorizationServerMetadata();
    const resource = oauthProtectedResourceMetadata();
    expect(auth.issuer).toBe("https://lab.example.test");
    expect(auth.code_challenge_methods_supported).toContain("S256");
    expect(auth.client_id_metadata_document_supported).toBe(true);
    expect(auth.token_endpoint_auth_methods_supported).toEqual(["none"]);
    expect(resource.resource).toBe("https://lab.example.test/mcp");
    expect(resource.authorization_servers).toEqual(["https://lab.example.test"]);
  });

  it("exchanges a one-time authorization code for access and refresh tokens", async () => {
    const { createAuthorizationCode, exchangeAuthorizationCode, parseAuthorizationRequest, validateOAuthAccessToken } = await import("../lib/oauth");
    const verifier = "v".repeat(64);
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "https://chatgpt.com/oauth/client.json",
      redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
      code_challenge: challenge(verifier),
      code_challenge_method: "S256",
      resource: "https://lab.example.test/mcp",
      scope: "workbench.read workbench.write",
      state: "test-state",
    });
    const request = parseAuthorizationRequest(params);
    const code = createAuthorizationCode(adminId, request);
    const token = exchangeAuthorizationCode({
      code,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeVerifier: verifier,
      resource: request.resource,
    });
    expect(token.access_token).toMatch(/^rw_at_/);
    expect(token.refresh_token).toMatch(/^rw_rt_/);
    expect(token.scope).toContain("workbench.write");
    const access = validateOAuthAccessToken(token.access_token);
    expect(access?.adminId).toBe(adminId);
    expect(access?.resource).toBe("https://lab.example.test/mcp");

    expect(() => exchangeAuthorizationCode({
      code,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeVerifier: verifier,
      resource: request.resource,
    })).toThrow("invalid_grant");
  });

  it("rotates refresh tokens and invalidates the previous access grant", async () => {
    const { createAuthorizationCode, exchangeAuthorizationCode, parseAuthorizationRequest, rotateRefreshToken, validateOAuthAccessToken } = await import("../lib/oauth");
    const verifier = "x".repeat(64);
    const request = parseAuthorizationRequest(new URLSearchParams({
      response_type: "code",
      client_id: "https://chatgpt.com/oauth/client.json",
      redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
      code_challenge: challenge(verifier),
      code_challenge_method: "S256",
      resource: "https://lab.example.test/mcp",
      scope: "workbench.read",
    }));
    const first = exchangeAuthorizationCode({
      code: createAuthorizationCode(adminId, request),
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeVerifier: verifier,
      resource: request.resource,
    });
    const second = rotateRefreshToken({ refreshToken: first.refresh_token, clientId: request.clientId, resource: request.resource });
    expect(second.refresh_token).not.toBe(first.refresh_token);
    expect(validateOAuthAccessToken(first.access_token)).toBeNull();
    expect(validateOAuthAccessToken(second.access_token)?.scopes).toContain("workbench.read");
    expect(() => rotateRefreshToken({ refreshToken: first.refresh_token, clientId: request.clientId, resource: request.resource })).toThrow("invalid_grant");
  });

  it("keeps static Codex bearer auth and enforces OAuth write scopes", async () => {
    const [{ authorizeMcpRequest }, { createAuthorizationCode, exchangeAuthorizationCode, parseAuthorizationRequest }] = await Promise.all([
      import("../lib/mcp-auth"),
      import("../lib/oauth"),
    ]);
    const staticRequest = new Request("https://lab.example.test/mcp", { headers: { authorization: "Bearer " + "s".repeat(48) } });
    expect(authorizeMcpRequest(staticRequest, "workbench.write").ok).toBe(true);

    const verifier = "z".repeat(64);
    const authRequest = parseAuthorizationRequest(new URLSearchParams({
      response_type: "code",
      client_id: "https://chatgpt.com/oauth/client.json",
      redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
      code_challenge: challenge(verifier),
      code_challenge_method: "S256",
      resource: "https://lab.example.test/mcp",
      scope: "workbench.read",
    }));
    const token = exchangeAuthorizationCode({
      code: createAuthorizationCode(adminId, authRequest),
      clientId: authRequest.clientId,
      redirectUri: authRequest.redirectUri,
      codeVerifier: verifier,
      resource: authRequest.resource,
    });
    const oauthRequest = new Request("https://lab.example.test/mcp", { headers: { authorization: "Bearer " + token.access_token } });
    expect(authorizeMcpRequest(oauthRequest, "workbench.read").ok).toBe(true);
    const denied = authorizeMcpRequest(oauthRequest, "workbench.write");
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.response.status).toBe(401);
      expect(denied.response.headers.get("www-authenticate")).toContain("insufficient_scope");
    }
  });
});
