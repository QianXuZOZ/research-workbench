"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Circle, Clock3, Flag, ListFilter, Milestone, Plus, Search, Trash2, X } from "lucide-react";
import { apiFetch, formatDate } from "@/lib/client-api";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import type { TaskItem } from "@/lib/task-data";

type Task = TaskItem;
const columns = [["todo", "待开始", Circle], ["doing", "进行中", Clock3], ["blocked", "受阻", Flag], ["done", "已完成", CheckCircle2]] as const;
const priorityName: Record<string, string> = { low: "低", medium: "中", high: "高", urgent: "紧急" };

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks); const [query, setQuery] = useState(""); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [relationsLoading, setRelationsLoading] = useState(false);
  const [form, setForm] = useState({ title: "", kind: "task", status: "todo", priority: "medium", dueAt: "", progress: "0", entityType: "", entityId: "", notes: "" }); const [relations, setRelations] = useState<Record<string, Record<string, unknown>[]>>({});
  const relationsLoaded = useRef(false); const relationsPromise = useRef<Promise<void> | null>(null);
  function load() { apiFetch<{ items: Task[] }>("/api/tasks").then((data) => setTasks(data.items)); }
  function ensureRelations() {
    if (relationsLoaded.current) return Promise.resolve();
    if (relationsPromise.current) return relationsPromise.current;
    setRelationsLoading(true);
    const promise = Promise.all(["projects", "papers", "patents", "growth"].map(async (type) => [type, (await apiFetch<{ items: Record<string, unknown>[] }>(`/api/records/${type}?limit=200`)).items] as const))
      .then((pairs) => { setRelations(Object.fromEntries(pairs)); relationsLoaded.current = true; })
      .finally(() => { setRelationsLoading(false); relationsPromise.current = null; });
    relationsPromise.current = promise;
    return promise;
  }
  function openCreate() { setOpen(true); void ensureRelations(); }
  useEffect(() => { if (new URLSearchParams(window.location.search).get("new") === "1") openCreate(); }, []);
  const filtered = useMemo(() => tasks.filter((task) => !query || task.title.toLowerCase().includes(query.toLowerCase())), [tasks, query]);
  async function create(event: React.FormEvent) { event.preventDefault(); setBusy(true); try { await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify({ ...form, dueAt: form.dueAt || null, progress: Number(form.progress), entityType: form.entityType || null, entityId: form.entityId || null }) }); setOpen(false); setForm({ title: "", kind: "task", status: "todo", priority: "medium", dueAt: "", progress: "0", entityType: "", entityId: "", notes: "" }); load(); } finally { setBusy(false); } }
  async function move(task: Task, status: string) { await apiFetch(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); load(); }
  async function remove(task: Task) { if (!confirm(`删除任务“${task.title}”？`)) return; await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" }); load(); }
  return <div className="tasks-page"><PageHeader title="任务中心" description="所有项目、成果和成长计划的行动项集中在这里。" actions={<button className="button primary" onClick={openCreate}><Plus size={16} />新建任务</button>} />
    <div className="task-toolbar"><div className="filter-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索任务…" /></div><span><ListFilter size={16} />{filtered.filter((task) => task.status !== "done").length} 项待推进</span></div>
    {tasks.length ? <div className="task-board">{columns.map(([status, label, Icon]) => { const list = filtered.filter((task) => task.status === status); return <section className={`task-column column-${status}`} key={status}><header><div><Icon size={17} /><h2>{label}</h2></div><span>{list.length}</span></header><div>{list.map((task) => { const due = String(task.due_at ?? ""); const overdue = status !== "done" && due && due < new Date().toISOString().slice(0, 10); return <article className="task-card" key={task.id}><div className="task-card-top"><span className={`priority-chip priority-${task.priority}`}>{priorityName[task.priority]}</span>{task.kind === "milestone" && <span className="kind-chip"><Milestone size={13} />里程碑</span>}<button className="icon-button" onClick={() => remove(task)} aria-label="删除任务"><Trash2 size={14} /></button></div><h3>{task.title}</h3>{Boolean(task.notes) && <p>{String(task.notes)}</p>}<div className="task-card-meta"><span className={overdue ? "overdue" : ""}><CalendarDays size={14} />{due ? formatDate(due) : "未设日期"}</span><span>{String(task.entity_type ?? "独立任务")}</span></div><div className="task-card-actions">{status !== "done" ? <button onClick={() => move(task, status === "todo" ? "doing" : "done")}><Check size={14} />{status === "todo" ? "开始" : "完成"}</button> : <button onClick={() => move(task, "todo")}>重新打开</button>}{status !== "blocked" && status !== "done" && <button onClick={() => move(task, "blocked")}>标记受阻</button>}</div></article>; })}{!list.length && <p className="column-empty">暂无任务</p>}</div></section>; })}</div> : <EmptyState icon={CheckCircle2} title="还没有任务" description="建立第一项行动，或从项目和论文详情中添加关联任务。" action={<button className="button primary" onClick={openCreate}><Plus size={16} />新建任务</button>} />}
    {open && <div className="sheet-scrim"><section className="sheet-panel task-sheet" role="dialog" aria-modal="true"><header><div><h2>新建任务</h2><p>把下一步行动写得具体、可完成。</p></div><button className="icon-button" onClick={() => setOpen(false)}><X size={20} /></button></header><form onSubmit={create}><div className="form-grid"><label className="wide"><span>任务名称<b>*</b></span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus placeholder="例如：完成暂态仿真工况检查" /></label><label><span>类型</span><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="task">任务</option><option value="milestone">里程碑</option></select></label><label><span>优先级</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option></select></label><label><span>截止日期</span><input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label><label><span>当前进度 (%)</span><input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></label><label><span>关联类型</span><select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value, entityId: "" })}><option value="">独立任务</option><option value="projects">项目</option><option value="papers">论文</option><option value="patents">专利</option><option value="growth">成长记录</option></select></label><label><span>关联记录</span><select value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} disabled={!form.entityType || relationsLoading}><option value="">{relationsLoading ? "正在加载关联记录…" : "请选择"}</option>{(relations[form.entityType] ?? []).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.title)}</option>)}</select></label><label className="wide"><span>说明</span><textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label></div><footer><button type="button" className="button ghost" onClick={() => setOpen(false)}>取消</button><button className="button primary" disabled={busy}>{busy ? "正在保存…" : "保存任务"}</button></footer></form></section></div>}
  </div>;
}
