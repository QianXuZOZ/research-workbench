import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, user: { email: session.email, mustChangePassword: session.mustChangePassword }, csrfToken: session.csrfToken, expiresAt: session.expiresAt });
}
