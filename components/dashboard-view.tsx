"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Award, BookOpenText, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, CircleDot, Clock3, FileBadge2, ListTodo, Plus, RefreshCw, ShieldAlert, Sparkles, Zap } from "lucide-react";
import { apiFetch, formatDate } from "@/lib/client-api";
import { PageHeader } from "@/components/page-header";

type DashboardData = {
  taskCounts: { overdue: number; due_week: number; done: number; total: number };
  upcoming: Record<string, unknown>[]; projectStats: { status: string; count: number }[]; paperStats: { status: string; count: number }[]; patentStats: { status: string; count: number }[];
  outputs: { papers: number; patents: number; completedProjects: number }; timezone: string; riskyProjects: Record<string, unknown>[]; activity: Record<string, unknown>[];
  promotion: null | { title: string; progress: number; requiredGaps: number; metrics: Record<string, unknown>[] };
};

const statusNames: Record<string, string> = { planning: "筹备", active: "进行中", paused: "暂停", completed: "完成", idea: "选题", drafting: "撰写", submitted: "已投稿", revision: "返修", accepted: "录用", published: "发表", rejected: "退稿", filed: "已申请", examining: "审查中", granted: "授权", expired: "失效" };

function Distribution({ title, items, href }: { title: string; items: { status: string; count: number }[]; href: string }) {
  const total = items.reduce((sum, item) => sum + Number(item.count), 0);
  return <div className="distribution"><div className="section-row"><h3>{title}</h3><Link href={href}>查看全部 <ArrowUpRight size={15} /></Link></div><div className="distribution-bar" aria-label={`${title}阶段分布`}>{items.map((item) => <span key={item.status} style={{ flexGrow: item.count }} title={`${statusNames[item.status] ?? item.status}：${item.count}`} />)}</div><div className="distribution-legend">{items.length ? items.slice(0, 4).map((item) => <span key={item.status}><i />{statusNames[item.status] ?? item.status}<strong>{item.count}</strong></span>) : <span>暂无记录</span>}</div><div className="distribution-total"><strong>{total}</strong><span>当前记录</span></div></div>;
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null); const [error, setError] = useState("");
  function load() { setError(""); apiFetch<DashboardData>("/api/dashboard").then(setData).catch((e) => setError(e.message)); }
  useEffect(load, []);
  if (error) return <div className="load-error"><ShieldAlert size={28} /><h2>总览暂时无法载入</h2><p>{error}</p><button className="button secondary" onClick={load}><RefreshCw size={16} />重试</button></div>;
  if (!data) return <div className="dashboard-skeleton"><div /><div /><div /><div /></div>;
  const overdue = Number(data.taskCounts.overdue ?? 0); const week = Number(data.taskCounts.due_week ?? 0); const done = Number(data.taskCounts.done ?? 0); const total = Number(data.taskCounts.total ?? 0);
  const completion = total ? Math.round((done / total) * 100) : 0;
  return <div className="dashboard-page">
    <PageHeader title="今天从哪里推进？" description={`${new Intl.DateTimeFormat("zh-CN", { timeZone: data.timezone, year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date())} · 先处理风险，再推进产出。`} actions={<><Link className="button secondary" href="/literature?import=1"><BookOpenText size={16} />导入文献</Link><Link className="button primary" href="/tasks?new=1"><Plus size={16} />新建任务</Link></>} />
    <section className="attention-deck" aria-label="今日关注">
      <div className={`attention-main ${overdue ? "danger" : "clear"}`}>
        <div className="attention-icon">{overdue ? <AlertTriangle size={25} /> : <CheckCircle2 size={25} />}</div>
        <div><p>{overdue ? "需要立即处理" : "当前没有逾期"}</p><strong>{overdue}</strong><span>项逾期任务</span></div>
        <Link href="/tasks?filter=overdue">检查任务 <ChevronRight size={16} /></Link>
      </div>
      <div className="attention-metric"><CalendarClock size={19} /><div><strong>{week}</strong><span>未来 7 天到期</span></div></div>
      <div className="attention-metric"><Zap size={19} /><div><strong>{completion}%</strong><span>全部任务完成率</span></div><div className="mini-progress"><i style={{ width: `${completion}%` }} /></div></div>
      <div className="attention-metric"><Award size={19} /><div><strong>{data.promotion?.progress ?? 0}%</strong><span>晋升指标完成度</span></div>{Boolean(data.promotion?.requiredGaps) && <em>{data.promotion?.requiredGaps} 个必达缺口</em>}</div>
    </section>
    <div className="dashboard-grid">
      <section className="timeline-panel">
        <div className="section-row"><div><h2>近期节点</h2><p>截止时间与优先级合并排序</p></div><Link href="/tasks">任务中心 <ArrowUpRight size={15} /></Link></div>
        <div className="timeline-list">{data.upcoming.length ? data.upcoming.map((task) => { const due = String(task.due_at ?? ""); const isOverdue = due && due < new Date().toISOString().slice(0, 10); return <div className={`timeline-item ${isOverdue ? "overdue" : ""}`} key={String(task.id)}><span className="timeline-node"><CircleDot size={16} /></span><div className="timeline-date"><strong>{formatDate(due)}</strong><span>{isOverdue ? "已逾期" : String(task.kind) === "milestone" ? "里程碑" : "任务"}</span></div><div className="timeline-content"><strong>{String(task.title)}</strong><span>{String(task.entity_type ?? "独立任务")} · {String(task.priority ?? "medium")}</span></div><span className={`status-badge priority-${task.priority}`}>{String(task.progress)}%</span></div>; }) : <div className="inline-empty"><Sparkles size={22} /><p>未来一周没有到期事项，可以安排下一步研究。</p></div>}</div>
      </section>
      <aside className="risk-panel">
        <div className="section-row"><div><h2>项目风险</h2><p>需要关注的在研项目</p></div><Link href="/projects">管理</Link></div>
        <div className="risk-list">{data.riskyProjects.length ? data.riskyProjects.map((project) => <Link href={`/projects/${project.id}`} key={String(project.id)}><span className={`risk-signal ${project.risk}`} /><div><strong>{String(project.title)}</strong><span>{project.end_date ? `${formatDate(String(project.end_date))} 截止` : "未设截止日期"}</span></div><b>{String(project.progress)}%</b></Link>) : <div className="inline-empty compact"><CheckCircle2 size={20} /><p>没有高风险项目</p></div>}</div>
        <div className="output-summary"><p>本年度成果</p><div><span><strong>{data.outputs.papers}</strong>发表论文</span><span><strong>{data.outputs.patents}</strong>授权专利</span><span><strong>{data.outputs.completedProjects}</strong>结项项目</span></div></div>
      </aside>
    </div>
    <section className="pipeline-section"><div className="section-row"><div><h2>科研管线</h2><p>从在研项目到成果沉淀的实时截面</p></div></div><div className="pipeline-grid"><Distribution title="项目" items={data.projectStats} href="/projects" /><Distribution title="论文" items={data.paperStats} href="/papers" /><Distribution title="专利" items={data.patentStats} href="/patents" /></div></section>
    <div className="dashboard-lower">
      <section className="promotion-snapshot"><div className="section-row"><div><h2>{data.promotion?.title ?? "晋升指标"}</h2><p>{data.promotion ? "自动汇总当前证据" : "建立一个评审周期以查看差距"}</p></div><Link href="/promotion">打开指标看板 <ArrowUpRight size={15} /></Link></div>{data.promotion ? <div className="metric-snapshot">{data.promotion.metrics.slice(0, 4).map((metric) => <div key={String(metric.id)}><div><strong>{String(metric.name)}</strong><span>{Number(metric.current)} / {Number(metric.target)}</span></div><div className="progress-track"><i style={{ width: `${Math.round(Number(metric.ratio) * 100)}%` }} /></div></div>)}</div> : <div className="inline-empty"><Award size={22} /><p>尚未设置晋升指标</p></div>}</section>
      <section className="activity-feed"><div className="section-row"><div><h2>最近动态</h2><p>工作台中的关键变更</p></div></div><div>{data.activity.length ? data.activity.map((item) => <div className="activity-row" key={String(item.id)}><span><Clock3 size={15} /></span><div><strong>{String(item.summary)}</strong><time>{formatDate(String(item.created_at), true)}</time></div></div>) : <div className="inline-empty compact"><ListTodo size={20} /><p>操作记录会显示在这里</p></div>}</div></section>
    </div>
  </div>;
}
