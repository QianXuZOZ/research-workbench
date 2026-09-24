"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Beaker, Boxes, FlaskConical, Lightbulb, Network, PackageSearch, Plus } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { statusLabel } from "@/lib/module-config";

type NodeItem = Record<string, unknown> & { id: string; title: string };
type Stage = { key: string; label: string; path: string; items: NodeItem[] };
type GraphData = {
  projects: { id: string; title: string; status: string; progress: number; risk: string }[];
  project: { id: string; title: string; status: string; progress: number; risk: string; summary?: string | null } | null;
  stages: Stage[];
  edges: { source: string; target: string; relation: string }[];
};

const icons = { questions: Lightbulb, hypotheses: Network, experiments: FlaskConical, runs: Beaker, findings: Boxes, artifacts: PackageSearch } as const;

export function ResearchGraph() {
  const [data, setData] = useState<GraphData | null>(null);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    apiFetch<GraphData>(`/api/research/graph${query}`).then((next) => {
      setData(next);
      if (!projectId && next.project?.id) setProjectId(next.project.id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  const edgeTargets = useMemo(() => new Set((data?.edges ?? []).map((edge) => edge.target)), [data]);
  const total = (data?.stages ?? []).reduce((sum, stage) => sum + stage.items.length, 0);

  if (loading && !data) return <div className="research-chain-skeleton"><span /><span /><span /></div>;

  return <div className="research-chain-wrap">
    <section className="research-chain-toolbar">
      <div>
        <label htmlFor="research-project">当前项目</label>
        <select id="research-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          {(data?.projects ?? []).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
        </select>
      </div>
      {data?.project && <div className="research-project-meta">
        <span className={`status-badge status-${data.project.status}`}>{statusLabel[data.project.status] ?? data.project.status}</span>
        <strong>{data.project.progress ?? 0}%</strong><span>项目进度</span>
        <strong>{total}</strong><span>科研过程记录</span>
      </div>}
    </section>

    {!data?.project ? <section className="research-chain-empty">
      <h2>还没有项目</h2><p>先建立项目，再从项目维度组织研究问题、假设、实验和发现。</p><Link className="button primary" href="/projects?new=1"><Plus size={16} />新建项目</Link>
    </section> : <>
      <section className="research-project-summary">
        <div><span>项目研究链</span><h2>{data.project.title}</h2><p>{data.project.summary || "从研究问题开始，把假设、实验、运行结果和结论逐层串起来。"}</p></div>
        <Link className="button secondary" href={`/questions?new=1&projectId=${data.project.id}`}><Plus size={16} />添加研究问题</Link>
      </section>

      <section className="research-chain-board" aria-label="项目研究链">
        {(data.stages ?? []).map((stage, index) => {
          const Icon = icons[stage.key as keyof typeof icons] ?? Boxes;
          return <div className="research-chain-stage" key={stage.key}>
            <header>
              <span><Icon size={18} /></span>
              <div><strong>{stage.label}</strong><small>{stage.items.length} 项</small></div>
              <Link href={stage.path}>全部</Link>
            </header>
            <div className="research-chain-nodes">
              {stage.items.length ? stage.items.slice(0, 8).map((item) => <Link className={`research-node ${edgeTargets.has(item.id) ? "linked" : ""}`} href={`${stage.path}/${item.id}`} key={item.id}>
                <strong>{item.title}</strong>
                <small>{item.status ? statusLabel[String(item.status)] ?? String(item.status) : String(item.artifactType ?? "")}</small>
              </Link>) : <div className="research-stage-empty">暂无记录</div>}
            </div>
            <Link className="research-stage-add" href={`${stage.path}?new=1&projectId=${data.project.id}`}><Plus size={14} />新增</Link>
            {index < data.stages.length - 1 && <span className="research-chain-arrow" aria-hidden="true"><ArrowRight size={18} /></span>}
          </div>;
        })}
      </section>
    </>}
  </div>;
}
