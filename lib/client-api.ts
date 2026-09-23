"use client";

export function csrfToken() {
  return document.querySelector<HTMLElement>("[data-csrf]")?.dataset.csrf ?? "";
}

export async function apiFetch<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (!(["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase()))) headers.set("x-csrf-token", csrfToken());
  const response = await fetch(input, { ...init, headers, cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload ? String((payload as { error: { message?: string } }).error?.message ?? "请求失败") : "请求失败";
    throw new Error(message);
  }
  return payload as T;
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  const timeZone = typeof document === "undefined" ? "Asia/Hong_Kong" : document.querySelector<HTMLElement>("[data-timezone]")?.dataset.timezone ?? "Asia/Hong_Kong";
  return new Intl.DateTimeFormat("zh-CN", { timeZone, year: "numeric", month: "short", day: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
}

export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}
