"use client";

import { useEffect, useState } from "react";
import { BookOpenText, CalendarDays, Check, FlaskConical, Inbox, Lightbulb, ListTodo, X } from "lucide-react";
import { apiFetch } from "@/lib/client-api";

const types = [
  ["inbox","收集箱",Inbox,"先记下来，稍后分类"],
  ["task","任务",ListTodo,"明确下一步行动"],
  ["question","研究问题",Lightbulb,"记录待验证的问题"],
  ["finding","研究发现",FlaskConical,"沉淀一个观察或结论"],
  ["literature","文献",BookOpenText,"保存待阅读资料"],
] as const;

export function QuickCaptureDialog({ open, onClose, onSaved }: { open:boolean; onClose:()=>void; onSaved?:()=>void }) {
  const [type,setType]=useState<(typeof types)[number][0]>("inbox");
  const [form,setForm]=useState({title:"",notes:"",url:"",dueAt:"",priority:"medium"});
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{ if(open) setTimeout(()=>document.getElementById("quick-capture-title")?.focus(),0); },[open]);
  useEffect(()=>{ if(!open) return; const handler=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); }; window.addEventListener("keydown",handler); return()=>window.removeEventListener("keydown",handler); },[open,onClose]);
  if(!open) return null;
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await apiFetch("/api/quick-capture",{method:"POST",body:JSON.stringify({
        type,title:form.title,notes:form.notes||null,url:form.url||null,dueAt:form.dueAt||null,priority:form.priority
      })});
      setForm({title:"",notes:"",url:"",dueAt:"",priority:"medium"}); setType("inbox"); onSaved?.(); onClose();
    } catch(err) { setError(err instanceof Error?err.message:"保存失败"); }
    finally { setBusy(false); }
  }
  return <div className="command-overlay quick-capture-overlay" role="dialog" aria-modal="true" aria-label="快速记录" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>
    <section className="quick-capture-dialog">
      <header><div><strong>快速记录</strong><span>先捕捉，再整理</span></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header>
      <div className="quick-type-grid">{types.map(([id,label,Icon,desc])=><button type="button" key={id} className={type===id?"active":""} onClick={()=>setType(id)}><Icon size={17}/><span><strong>{label}</strong><small>{desc}</small></span>{type===id&&<Check size={14}/>}</button>)}</div>
      <form onSubmit={submit}>
        <label><span>标题</span><input id="quick-capture-title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required placeholder="一句话写清楚…" /></label>
        <label><span>补充说明</span><textarea rows={4} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="上下文、依据、下一步想法…" /></label>
        {(type==="literature"||type==="inbox")&&<label><span>链接</span><input value={form.url} onChange={(e)=>setForm({...form,url:e.target.value})} placeholder="https://…（可留空）" /></label>}
        {type==="task"&&<div className="quick-task-fields"><label><span>截止日期</span><div className="input-with-leading"><CalendarDays size={15}/><input type="date" value={form.dueAt} onChange={(e)=>setForm({...form,dueAt:e.target.value})}/></div></label><label><span>优先级</span><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})}><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="urgent">紧急</option></select></label></div>}
        {error&&<p className="form-error">{error}</p>}
        <footer><span>Ctrl + Shift + N 可随时打开</span><button className="button primary" disabled={busy}>{busy?"正在保存…":"保存"}</button></footer>
      </form>
    </section>
  </div>;
}
