import { sqlite } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { updateSearchIndex } from "@/lib/search";
import { nowIso } from "@/lib/utils";

export type QuickCaptureType = "inbox" | "task" | "question" | "finding" | "literature";
export type QuickCaptureInput = {
  type: QuickCaptureType;
  title: string;
  notes?: string | null;
  url?: string | null;
  dueAt?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
};

export function createQuickCapture(input: QuickCaptureInput) {
  const id = crypto.randomUUID();
  const now = nowIso();
  const title = input.title.trim();
  const notes = input.notes?.trim() || null;
  const url = input.url?.trim() || null;

  if (input.type === "inbox") {
    sqlite.prepare("INSERT INTO inbox_items (id,title,body,kind,source_url,status,created_at,updated_at) VALUES (?,?,?,?,?,'inbox',?,?)")
      .run(id, title, notes, url ? "link" : "note", url, now, now);
    logActivity("create", `收集到 Inbox：${title}`, "inbox", id);
    return { id, type: input.type };
  }

  if (input.type === "task") {
    sqlite.prepare(`INSERT INTO tasks (id,title,kind,status,priority,due_at,start_at,completed_at,progress,entity_type,entity_id,notes,created_at,updated_at)
      VALUES (?,?,'task','todo',?,?,NULL,NULL,0,NULL,NULL,?,?,?)`)
      .run(id, title, input.priority ?? "medium", input.dueAt || null, notes, now, now);
    updateSearchIndex("tasks", id, title, notes ?? "");
    logActivity("create", `快速新建任务：${title}`, "tasks", id);
    return { id, type: input.type };
  }

  if (input.type === "question") {
    sqlite.prepare(`INSERT INTO research_questions (id,title,project_id,status,context,success_criteria,keywords,notes,created_at,updated_at)
      VALUES (?,? ,NULL,'open',?,NULL,NULL,NULL,?,?)`).run(id, title, notes, now, now);
    updateSearchIndex("questions", id, title, notes ?? "");
    logActivity("create", `快速记录研究问题：${title}`, "questions", id);
    return { id, type: input.type };
  }

  if (input.type === "finding") {
    sqlite.prepare(`INSERT INTO findings (id,title,project_id,experiment_id,run_id,status,claim,evidence,confidence,keywords,notes,created_at,updated_at)
      VALUES (?,? ,NULL,NULL,NULL,'candidate',?,NULL,50,NULL,NULL,?,?)`).run(id, title, notes, now, now);
    updateSearchIndex("findings", id, title, notes ?? "");
    logActivity("create", `快速记录研究发现：${title}`, "findings", id);
    return { id, type: input.type };
  }

  sqlite.prepare(`INSERT INTO literature_items (id,title,authors,venue,venue_type,status,year,doi,url,abstract,keywords,notes,bibtex,created_at,updated_at)
    VALUES (?, ?,NULL,NULL,'other','unread',NULL,NULL,?,NULL,NULL,?,NULL,?,?)`).run(id, title, url, notes, now, now);
  updateSearchIndex("literature", id, title, [url, notes].filter(Boolean).join(" "));
  logActivity("create", `快速记录文献：${title}`, "literature", id);
  return { id, type: input.type };
}
