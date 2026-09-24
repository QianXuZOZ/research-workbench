import { NextRequest } from "next/server";
import { sqlite } from "@/lib/db";
import { requireApiSession } from "@/lib/security";
import { jsonError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession();
  if ("response" in auth) return auth.response;

  const projects = sqlite.prepare("SELECT id,title,status,progress,risk FROM projects WHERE archived_at IS NULL ORDER BY updated_at DESC").all() as Record<string, unknown>[];
  const requestedProjectId = request.nextUrl.searchParams.get("projectId") ?? "";
  const projectId = requestedProjectId || String(projects[0]?.id ?? "");

  if (!projectId) {
    return Response.json({ projects, project: null, stages: [], edges: [] });
  }

  const project = sqlite.prepare("SELECT id,title,status,progress,risk,summary FROM projects WHERE id=? AND archived_at IS NULL").get(projectId) as Record<string, unknown> | undefined;
  if (!project) return jsonError("项目不存在", 404, "NOT_FOUND");

  const questions = sqlite.prepare("SELECT id,title,status,project_id AS projectId FROM research_questions WHERE project_id=? AND archived_at IS NULL ORDER BY updated_at DESC").all(projectId) as Record<string, unknown>[];
  const hypotheses = sqlite.prepare("SELECT id,title,status,project_id AS projectId,question_id AS questionId FROM hypotheses WHERE project_id=? AND archived_at IS NULL ORDER BY updated_at DESC").all(projectId) as Record<string, unknown>[];
  const experiments = sqlite.prepare("SELECT id,title,status,project_id AS projectId,hypothesis_id AS hypothesisId,platform FROM experiments WHERE project_id=? AND archived_at IS NULL ORDER BY updated_at DESC").all(projectId) as Record<string, unknown>[];

  const experimentIds = experiments.map((item) => String(item.id));
  const runRows = experimentIds.length
    ? sqlite.prepare(`SELECT id,title,status,experiment_id AS experimentId,run_at AS runAt,error_metric AS errorMetric FROM experiment_runs WHERE experiment_id IN (${experimentIds.map(() => "?").join(",")}) AND archived_at IS NULL ORDER BY updated_at DESC`).all(...experimentIds) as Record<string, unknown>[]
    : [];

  const findings = sqlite.prepare("SELECT id,title,status,project_id AS projectId,experiment_id AS experimentId,run_id AS runId,confidence FROM findings WHERE project_id=? AND archived_at IS NULL ORDER BY updated_at DESC").all(projectId) as Record<string, unknown>[];
  const artifacts = sqlite.prepare("SELECT id,title,project_id AS projectId,experiment_id AS experimentId,run_id AS runId,artifact_type AS artifactType,storage_type AS storageType FROM artifacts WHERE project_id=? AND archived_at IS NULL ORDER BY updated_at DESC").all(projectId) as Record<string, unknown>[];

  const stages = [
    { key: "questions", label: "研究问题", path: "/questions", items: questions },
    { key: "hypotheses", label: "研究假设", path: "/hypotheses", items: hypotheses },
    { key: "experiments", label: "实验设计", path: "/experiments", items: experiments },
    { key: "runs", label: "实验运行", path: "/runs", items: runRows },
    { key: "findings", label: "研究发现", path: "/findings", items: findings },
    { key: "artifacts", label: "科研资产", path: "/artifacts", items: artifacts },
  ];

  const edges: { source: string; target: string; relation: string }[] = [];
  for (const item of hypotheses) if (item.questionId) edges.push({ source: String(item.questionId), target: String(item.id), relation: "tests" });
  for (const item of experiments) if (item.hypothesisId) edges.push({ source: String(item.hypothesisId), target: String(item.id), relation: "validated-by" });
  for (const item of runRows) if (item.experimentId) edges.push({ source: String(item.experimentId), target: String(item.id), relation: "run" });
  for (const item of findings) {
    if (item.runId) edges.push({ source: String(item.runId), target: String(item.id), relation: "supports" });
    else if (item.experimentId) edges.push({ source: String(item.experimentId), target: String(item.id), relation: "supports" });
  }
  for (const item of artifacts) {
    if (item.runId) edges.push({ source: String(item.runId), target: String(item.id), relation: "artifact" });
    else if (item.experimentId) edges.push({ source: String(item.experimentId), target: String(item.id), relation: "artifact" });
  }

  return Response.json({ projects, project, stages, edges });
}
