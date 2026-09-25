import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sqlite } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { normalizeThemeConfig } from "@/lib/theme-presets";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(); if (!session) redirect("/login");
  const settingRows = sqlite.prepare("SELECT key,value FROM settings WHERE key IN ('displayName','timezone','themePreset','themeMode','themeOverrides')").all() as { key: string; value: string }[];
  const settings = Object.fromEntries(settingRows.map((row) => [row.key,row.value]));
  const displayName = settings.displayName ?? "研究者";
  const timeZone = settings.timezone ?? process.env.APP_TIMEZONE ?? "Asia/Hong_Kong";
  let overrides = {}; try { overrides = JSON.parse(settings.themeOverrides ?? "{}"); } catch {}
  const initialTheme = normalizeThemeConfig({ preset: settings.themePreset as never, mode: settings.themeMode as never, overrides });
  const hasAvatar = Boolean(sqlite.prepare("SELECT 1 FROM attachments WHERE entity_type='profile' AND entity_id='avatar' LIMIT 1").get());
  return <AppShell email={session.email} displayName={displayName} avatarUrl={hasAvatar ? "/api/profile/avatar" : null} csrf={session.csrfToken} mustChangePassword={session.mustChangePassword} timeZone={timeZone} initialTheme={initialTheme}>{children}</AppShell>;
}
