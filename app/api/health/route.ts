import { adminConfigured } from "@/lib/auth";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    sqlite.prepare("SELECT 1").get();
    return Response.json({ status: "ok", database: "ready", adminConfigured: adminConfigured(), time: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}
