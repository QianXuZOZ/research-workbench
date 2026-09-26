import { sqlite } from "@/lib/db";

export const DEFAULT_WORKBENCH_NAME = "电研工作台";

export function getAppSettings(keys: string[]) {
  if (!keys.length) return {} as Record<string, string>;
  const placeholders = keys.map(() => "?").join(",");
  const rows = sqlite.prepare(`SELECT key,value FROM settings WHERE key IN (${placeholders})`).all(...keys) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, string>;
}

export function getAppSetting(key: string, fallback = "") {
  const row = sqlite.prepare("SELECT value FROM settings WHERE key = ? LIMIT 1").get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function getWorkbenchName() {
  const value = getAppSetting("workbenchName", DEFAULT_WORKBENCH_NAME).trim();
  return value || DEFAULT_WORKBENCH_NAME;
}
