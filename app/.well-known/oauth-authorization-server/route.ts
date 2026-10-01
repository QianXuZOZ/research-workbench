import { oauthAuthorizationServerMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(oauthAuthorizationServerMetadata(), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
