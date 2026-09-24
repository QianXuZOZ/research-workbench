"use client";

import { defaultThemeConfig, normalizeThemeConfig, resolveThemeVariables, type ThemeConfig } from "@/lib/theme-presets";

export const themeStorageKey = "research-workbench-theme";

export function effectiveThemeMode(config: ThemeConfig): "light" | "dark" {
  if (config.mode === "light" || config.mode === "dark") return config.mode;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function applyThemeConfig(input: ThemeConfig, persist = true) {
  const config = normalizeThemeConfig(input);
  const mode = effectiveThemeMode(config);
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.themePreset = config.preset;
  for (const [key,value] of Object.entries(resolveThemeVariables(config, mode))) root.style.setProperty(key, value);
  if (persist) localStorage.setItem(themeStorageKey, JSON.stringify(config));
  return { config, mode };
}

export function readStoredThemeConfig(fallback: ThemeConfig = defaultThemeConfig) {
  try {
    const raw = localStorage.getItem(themeStorageKey);
    if (raw) return normalizeThemeConfig(JSON.parse(raw));
    const legacy = localStorage.getItem("theme");
    if (legacy === "light" || legacy === "dark") return normalizeThemeConfig({ ...fallback, mode: legacy });
  } catch {}
  return normalizeThemeConfig(fallback);
}
