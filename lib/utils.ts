export const nowIso = () => new Date().toISOString();

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeDoi(value?: string | null) {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "") || null;
}

export function normalizeTitle(value: string) {
  return value.toLowerCase().normalize("NFKC").replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function safeFilename(value: string) {
  return value.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").replace(/\.+$/g, "").slice(0, 180) || "file";
}

export function jsonError(message: string, status = 400, code = "BAD_REQUEST", fields?: Record<string, string>) {
  return Response.json({ error: { code, message, fields } }, { status });
}

export function calendarDateInTimeZone(date = new Date(), timeZone = process.env.APP_TIMEZONE ?? "Asia/Hong_Kong") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
