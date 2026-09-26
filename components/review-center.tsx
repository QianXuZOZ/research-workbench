"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, BookOpenText, Check, CheckCircle2, FlaskConical, Lightbulb, ListTodo, Save, TestTube2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { apiFetch, formatDate } from "@/lib/client-api";
import { PageHeader } from "@/components/page-header";

type Row=Record<string,unknown>;
type ReviewData={
  start:string;end:string;today:string;timezone:string;
  counts:{tasksCompleted:number;questionsCreated:number;experimentsCreated:number;runsCreated:number;findingsCreated:number;literatureAdded:number};
  recentFindings:Row[];completedTasks:Row[];activity:Row[];review:Row|null;staleProjects:Row[];
};

export function ReviewCenter({initialData:data}:{initialData:ReviewData}) {
  const [reflection,setReflection]=useState(String(data.review?.reflection??""));
  const [nextFocus,setNextFocus]=useState(String(data.review?.next_focus??""));
  const [busy,setBusy]=useState(false); const [saved,setSaved]=useState(false);
  async function save(){
    setBusy(true); setSaved(false);
    try{await apiFetch("/api/reviews",{method:"PUT",body:JSON.stringify({periodStart:data.start,periodEnd:data.end,reflection:reflection||null,nextFocus:nextFocus||null})});setSaved(true);setTimeout(()=>setSaved(false),2200);}
    finally{setBusy(false);}
  }
  const metrics=[
    ["完成任务",data.counts.tasksCompleted,ListTodo],
    ["研究问题",data.counts.questionsCreated,Lightbulb],
    ["实验设计",data.counts.experimentsCreated,TestTube2],
    ["实验运行",data.counts.runsCreated,Activity],
    ["研究发现",data.counts.findingsCreated,FlaskConical],
    ["新增文献",data.counts.literatureAdded,BookOpenText],
  ] as const;
  return <div className="review-page">
    <PageHeader title="复盘中心" description={"本周 "+formatDate(data.start)+" — "+formatDate(data.end)+" · 自动汇总进展，再决定下一周往哪里用力。"} actions={<button className="button primary" onClick={save} disabled={busy}><Save size={16}/>{busy?"正在保存…":"保存本周复盘"}</button>}/>
    {saved&&<div className="review-saved"><Check size={15}/>已保存</div>}
    <div className="review-metrics">{metrics.map(([label,value,Icon])=><div key={label}><span><Icon size={17}/></span><strong>{value}</strong><small>{label}</small></div>)}</div>
    <div className="review-grid">
      <section className="review-panel"><header><div><h2>本周完成</h2><p>已完成任务与产生的研究发现</p></div></header>
        <div className="review-subsection"><h3>完成任务</h3>{data.completedTasks.length?<div className="review-list">{data.completedTasks.map(t=><div key={String(t.id)}><CheckCircle2 size={15}/><div><strong>{String(t.title)}</strong><span>{formatDate(String(t.completed_at??""),true)} · {String(t.priority??"medium")}</span></div></div>)}</div>:<p className="review-empty">本周还没有完成任务。</p>}</div>
        <div className="review-subsection"><h3>研究发现</h3>{data.recentFindings.length?<div className="review-list">{data.recentFindings.map(f=><Link href={"/findings/"+String(f.id)} key={String(f.id)}><FlaskConical size={15}/><div><strong>{String(f.title)}</strong><span>{String(f.status??"candidate")} · 置信度 {String(f.confidence??50)}%</span></div><ArrowUpRight size={14}/></Link>)}</div>:<p className="review-empty">本周还没有新增 Finding。</p>}</div>
      </section>
      <section className="review-panel"><header><div><h2>需要关注</h2><p>长期未更新的在研项目</p></div><Link href="/projects">项目管理</Link></header>
        {data.staleProjects.length?<div className="review-stale">{data.staleProjects.map(p=><Link href={"/projects/"+String(p.id)} key={String(p.id)}><TriangleAlert size={15}/><div><strong>{String(p.title)}</strong><span>{String(p.progress??0)}% · 最后更新 {formatDate(String(p.updated_at),true)}</span></div></Link>)}</div>:<div className="review-empty-block"><CheckCircle2 size={22}/><p>没有超过 14 天未更新的在研项目。</p></div>}
      </section>
    </div>
    <section className="review-write"><div><label><span>本周复盘</span><small>哪些工作真正产生了进展？哪里出现了偏差、阻塞或新的认识？</small><textarea rows={8} value={reflection} onChange={(e)=>setReflection(e.target.value)} placeholder="记录本周最重要的进展、问题与判断…"/></label></div><div><label><span>下周重点</span><small>尽量只写 1–3 个真正重要的推进目标。</small><textarea rows={8} value={nextFocus} onChange={(e)=>setNextFocus(e.target.value)} placeholder="例如：完成 DSOGI 三类模型统一验证；提交返修稿；补充一组 HIL 工况…"/></label></div></section>
    <section className="review-activity"><header><h2>本周活动轨迹</h2><p>最近操作用于帮助你回忆这一周发生过什么。</p></header><div>{data.activity.length?data.activity.slice(0,12).map(a=><div key={String(a.id)}><Activity size={14}/><span>{String(a.summary)}</span><time>{formatDate(String(a.created_at),true)}</time></div>):<p className="review-empty">本周还没有活动记录。</p>}</div></section>
  </div>;
}
