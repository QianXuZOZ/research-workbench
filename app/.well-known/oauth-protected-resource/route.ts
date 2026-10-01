import { oauthProtectedResourceMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(oauthProtectedResourceMetadata(), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return Response.json({ error: "OAuth is not configured" }, { status: 503 });
  }
}
