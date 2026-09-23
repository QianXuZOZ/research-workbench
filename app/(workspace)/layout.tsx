import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(); if (!session) redirect("/login");
  const displayName = (sqlite.prepare("SELECT value FROM settings WHERE key='displayName'").get() as { value: string } | undefined)?.value ?? "研究者";
  return <AppShell email={session.email} displayName={displayName} csrf={session.csrfToken} mustChangePassword={session.mustChangePassword}>{children}</AppShell>;
}
