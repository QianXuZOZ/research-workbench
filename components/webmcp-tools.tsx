"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/client-api";

export function WebMcpTools() {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = (error: unknown) => {
      if ((typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") || String(error).includes("AbortError")) return;
      console.warn("WebMCP tool registration failed", error);
    };
    void Promise.resolve(context.registerTool({
      name: "search_research_records",
      title: "搜索科研记录",
      description: "Search the signed-in researcher's projects, papers, patents, growth records, and tasks by title or keyword.",
      inputSchema: { type: "object", properties: { query: { type: "string", minLength: 2, maxLength: 100 } }, required: ["query"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        const query = typeof input === "object" && input && "query" in input ? String((input as { query: unknown }).query).trim() : "";
        if (query.length < 2) throw new Error("query must contain at least two characters");
        const result = await apiFetch<{ items: { entityType: string; entityId: string; title: string }[] }>(`/api/search?q=${encodeURIComponent(query)}`);
        return { count: result.items.length, items: result.items.map(({ entityType, entityId, title }) => ({ entityType, entityId, title })) };
      },
    }, { signal: lifecycle.signal })).catch(report);
    void Promise.resolve(context.registerTool({
      name: "create_research_task",
      title: "新建科研任务",
      description: "Create a task in the signed-in researcher's unified task center after all required task details are provided.",
      inputSchema: { type: "object", properties: { title: { type: "string", minLength: 1, maxLength: 300 }, dueAt: { type: ["string", "null"], description: "Optional YYYY-MM-DD due date" }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }, notes: { type: ["string", "null"], maxLength: 5000 } }, required: ["title", "priority"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        if (typeof input !== "object" || !input) throw new Error("task input is required");
        const value = input as { title?: unknown; dueAt?: unknown; priority?: unknown; notes?: unknown };
        const title = String(value.title ?? "").trim(); const priority = String(value.priority ?? "medium");
        if (!title || !["low", "medium", "high", "urgent"].includes(priority)) throw new Error("invalid task title or priority");
        const result = await apiFetch<{ item: { id: string; title: string; status: string } }>("/api/tasks", { method: "POST", body: JSON.stringify({ title, dueAt: value.dueAt || null, priority, notes: value.notes || null, kind: "task", status: "todo", progress: 0 }) });
        return { id: result.item.id, title: result.item.title, status: result.item.status };
      },
    }, { signal: lifecycle.signal })).catch(report);
    return () => lifecycle.abort();
  }, []);
  return null;
}
