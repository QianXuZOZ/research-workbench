"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Inbox, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, formatDate } from "@/lib/client-api";
import { PageHeader } from "@/components/page-header";
import type { InboxItem } from "@/lib/inbox-data";

const targetLabels:Record<string,string>={task:"任务",question:"研究问题",finding:"研究发现",literature:"文献"};
const targetPaths:Record<string,string>={task:"/tasks",question:"/questions/",finding:"/findings/",literature:"/literature/"};

export function InboxView({initialItems}:{initialItems:InboxItem[]}) {
  const [items,setItems]=useState(initialItems); const [status,setStatus]=useState("inbox"); const [query,setQuery]=useState("");
  const [targets,setTargets]=useState<Record<string,string>>({}); const [busy,setBusy]=useState("");
  const [form,setForm]=useState({title:"",body:"",sourceUrl:""});
  useEffect(()=>setItems(initialItems),[initialItems]);
  useEffect(()=>{const handler=()=>{if(status==="inbox")void load("inbox",query);};window.addEventListener("workbench-data-changed",handler);return()=>window.removeEventListener("workbench-data-changed",handler);},[status,query]);
  async function load(nextStatus=status,nextQuery=query){
    const data=await apiFetch<{items:InboxItem[]}>("/api/inbox?status="+encodeURIComponent(nextStatus)+"&q="+encodeURIComponent(nextQuery));
    setItems(data.items);
  }
  async function add(e:React.FormEvent){
    e.preventDefault(); if(!form.title.trim()) return; setBusy("new");
    try{await apiFetch("/api/inbox",{method:"POST",body:JSON.stringify({title:form.title,body:form.body||null,sourceUrl:form.sourceUrl||null,kind:form.sourceUrl?"link":"note"})}); setForm({title:"",body:"",sourceUrl:""}); if(status!=="inbox"){setStatus("inbox");await load("inbox","");}else await load();}
    finally{setBusy("");}
  }
  async function process(item:InboxItem){
    const target=targets[item.id]||"task"; setBusy(item.id);
    try{await apiFetch("/api/inbox/"+item.id+"/process",{method:"POST",body:JSON.stringify({targetType:target})}); await load();}
    finally{setBusy("");}
  }
  async function remove(item:InboxItem){
    if(!confirm("移除这条收集记录？"))return; setBusy(item.id);
    try{await apiFetch("/api/inbox/"+item.id,{method:"DELETE"});await load();}finally{setBusy("");}
  }
  function switchStatus(next:string){setStatus(next);setQuery("");void load(next,"");}
  const countLabel=useMemo(()=>items.length+" 条", [items]);
  return <div className="inbox-page">
    <PageHeader title="收集箱" description="先记录，再决定它应该成为任务、问题、Finding 还是文献。"/>
    <form className="inbox-capture" onSubmit={add}>
      <div><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="刚想到什么？先放进来…" required/><textarea rows={2} value={form.body} onChange={(e)=>setForm({...form,body:e.target.value})} placeholder="补充上下文（可留空）"/></div>
      <div><input value={form.sourceUrl} onChange={(e)=>setForm({...form,sourceUrl:e.target.value})} placeholder="链接（可留空）"/><button className="button primary" disabled={busy==="new"}><Plus size={15}/>{busy==="new"?"正在收集…":"加入 Inbox"}</button></div>
    </form>
    <div className="inbox-toolbar">
      <div className="segmented"><button className={status==="inbox"?"active":""} onClick={()=>switchStatus("inbox")}>待整理</button><button className={status==="processed"?"active":""} onClick={()=>switchStatus("processed")}>已处理</button></div>
      <div className="filter-search"><Search size={16}/><input value={query} onChange={(e)=>{const v=e.target.value;setQuery(v);void load(status,v);}} placeholder="搜索收集箱…"/></div><span>{countLabel}</span>
    </div>
    <div className="inbox-list">{items.length?items.map(item=><article className="inbox-item" key={item.id}>
      <div className="inbox-kind"><Inbox size={16}/><span>{String(item.kind)==="link"?"链接":String(item.kind)==="idea"?"想法":"记录"}</span></div>
      <div className="inbox-content"><strong>{item.title}</strong>{item.body&&<p>{String(item.body)}</p>}<div><time>{formatDate(item.created_at,true)}</time>{item.source_url&&<a href={String(item.source_url)} target="_blank" rel="noreferrer"><ExternalLink size={13}/>打开链接</a>}</div></div>
      {status==="inbox"?<div className="inbox-process"><select value={targets[item.id]||"task"} onChange={(e)=>setTargets({...targets,[item.id]:e.target.value})}><option value="task">转为任务</option><option value="question">转为研究问题</option><option value="finding">转为研究发现</option><option value="literature">转为文献</option></select><button className="button secondary" disabled={busy===item.id} onClick={()=>process(item)}>整理 <ArrowRight size={14}/></button><button className="icon-button danger" onClick={()=>remove(item)}><Trash2 size={14}/></button></div>:<div className="inbox-processed"><CheckCircle2 size={16}/><span>已转为 {targetLabels[String(item.target_type)]??String(item.target_type??"记录")}</span>{item.target_id&&targetPaths[String(item.target_type)]&&<Link href={targetPaths[String(item.target_type)]+(String(item.target_type)==="task"?"":String(item.target_id))}>查看</Link>}</div>}
    </article>):<div className="inbox-empty"><CheckCircle2 size={28}/><h3>{status==="inbox"?"收集箱已清空":"还没有已处理记录"}</h3><p>{status==="inbox"?"临时想法都已经进入正式工作流。":"整理 Inbox 后，转换记录会出现在这里。"}</p></div>}</div>
  </div>;
}
