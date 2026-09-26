"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock3, Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { apiFetch, formatDate } from "@/lib/client-api";
import { PageHeader } from "@/components/page-header";

type Row=Record<string,unknown>;
type FocusData={today:string;weekEnd:string;timezone:string;todayTasks:Row[];weekTasks:Row[];inbox:Row[];inboxCount:number;staleProjects:Row[]};

export function FocusView({initialData}:{initialData:FocusData}) {
  const [data,setData]=useState(initialData); const [busy,setBusy]=useState("");
  async function reload(){ const res=await apiFetch<FocusData>("/api/focus"); setData(res); }
  async function taskAction(id:string,status:string){ setBusy(id); try{await apiFetch("/api/tasks/"+id,{method:"PATCH",body:JSON.stringify({status})}); await reload();}finally{setBusy("");}}
  const overdue=data.todayTasks.filter(t=>t.due_at&&String(t.due_at)<data.today).length;
  const dateLabel=new Intl.DateTimeFormat("zh-CN",{timeZone:data.timezone,year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date());
  return <div className="focus-page">
    <PageHeader title="今日" description={dateLabel+" · 只看现在需要推进的事情。"} actions={<><Link className="button secondary" href="/inbox"><Inbox size={16}/>整理收集箱</Link><Link className="button primary" href="/tasks?new=1">新建任务</Link></>}/>
    <div className="focus-summary">
      <div className={overdue?"danger":""}><span>{overdue?<AlertTriangle size={18}/>:<CheckCircle2 size={18}/>}</span><strong>{overdue}</strong><small>逾期</small></div>
      <div><span><Clock3 size={18}/></span><strong>{data.todayTasks.length}</strong><small>今日推进</small></div>
      <div><span><CalendarDays size={18}/></span><strong>{data.weekTasks.length}</strong><small>未来 7 天</small></div>
      <div><span><Inbox size={18}/></span><strong>{data.inboxCount}</strong><small>待整理</small></div>
    </div>
    <div className="focus-grid">
      <section className="focus-panel"><header><div><h2>今天要推进</h2><p>进行中、今日到期与逾期任务</p></div><Link href="/tasks">任务中心 <ArrowUpRight size={14}/></Link></header>
        <div className="focus-task-list">{data.todayTasks.length?data.todayTasks.map(t=>{const id=String(t.id),due=String(t.due_at??""),late=Boolean(due&&due<data.today);return <article key={id} className={late?"late":""}><button className="focus-check" disabled={busy===id} onClick={()=>taskAction(id,"done")} title="完成"><Check size={14}/></button><div><strong>{String(t.title)}</strong><span>{late?"已逾期":due?formatDate(due)+" 截止":"进行中"} · {String(t.priority??"medium")}</span></div>{String(t.status)==="todo"&&<button className="text-action" onClick={()=>taskAction(id,"doing")}>开始</button>}</article>}):<div className="focus-empty"><CheckCircle2 size={22}/><p>今天没有必须处理的任务。</p></div>}</div>
      </section>
      <section className="focus-panel"><header><div><h2>本周安排</h2><p>未来 7 天的明确截止事项</p></div></header>
        <div className="focus-week-list">{data.weekTasks.length?data.weekTasks.map(t=><article key={String(t.id)}><time>{formatDate(String(t.due_at??""))}</time><div><strong>{String(t.title)}</strong><span>{String(t.priority??"medium")} · {String(t.status??"todo")}</span></div></article>):<div className="focus-empty"><CalendarDays size={22}/><p>未来一周没有到期任务。</p></div>}</div>
      </section>
      <section className="focus-panel"><header><div><h2>待整理</h2><p>Inbox 中还没有进入正式工作流的内容</p></div><Link href="/inbox">全部 {data.inboxCount}</Link></header>
        <div className="focus-inbox-list">{data.inbox.length?data.inbox.map(x=><Link href="/inbox" key={String(x.id)}><Inbox size={15}/><div><strong>{String(x.title)}</strong><span>{x.source_url?"链接":"临时记录"}</span></div></Link>):<div className="focus-empty"><Inbox size={22}/><p>收集箱已经清空。</p></div>}</div>
      </section>
      <section className="focus-panel"><header><div><h2>停滞项目</h2><p>超过 14 天没有更新的在研项目</p></div><Link href="/projects">项目管理</Link></header>
        <div className="focus-stale-list">{data.staleProjects.length?data.staleProjects.map(p=><Link href={"/projects/"+String(p.id)} key={String(p.id)}><span><TriangleAlert size={15}/></span><div><strong>{String(p.title)}</strong><small>{String(p.progress??0)}% · 最后更新 {formatDate(String(p.updated_at),true)}</small></div></Link>):<div className="focus-empty"><RefreshCw size={22}/><p>当前没有长期停滞项目。</p></div>}</div>
      </section>
    </div>
  </div>;
}
