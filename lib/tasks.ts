import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "请输入任务名称").max(300),
  kind: z.enum(["task", "milestone"]).default("task"),
  status: z.enum(["todo", "doing", "done", "blocked"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueAt: z.string().nullable().optional(),
  startAt: z.string().nullable().optional(),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  entityType: z.string().max(30).nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});
