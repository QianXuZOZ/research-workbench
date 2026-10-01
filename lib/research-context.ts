import { sqlite } from "@/lib/db";
import { fromDatabase } from "@/lib/records";

type Row = Record<string, unknown>;

function placeholders(items: unknown[]) {
  return items.map(() => "?").join(",");
}

export function getResearchContext(projectId: string) {
  const projectRow = sqlite.prepare("SELECT * FROM projects WHERE id=? AND archived_at IS NULL").get(projectId) as Row | undefined;
  if (!projectRow) throw new Error("Project not found");

  const questions = sqlite.prepare("SELECT * FROM research_questions WHERE archived_at IS NULL AND project_id=? ORDER BY updated_at DESC").all(projectId) as Row[];
  const hypotheses = sqlite.prepare("SELECT * FROM hypotheses WHERE archived_at IS NULL AND project_id=? ORDER BY updated_at DESC").all(projectId) as Row[];
  const experiments = sqlite.prepare("SELECT * FROM experiments WHERE archived_at IS NULL AND project_id=? ORDER BY updated_at DESC").all(projectId) as Row[];

  const experimentIds = experiments.map((item) => String(item.id));
  const runs = experimentIds.length
    ? sqlite.prepare(`SELECT * FROM experiment_runs WHERE archived_at IS NULL AND experiment_id IN (${placeholders(experimentIds)}) ORDER BY updated_at DESC`).all(...experimentIds) as Row[]
    : [];

  const runIds = runs.map((item) => String(item.id));
  const findingConditions = ["project_id=?"]; const findingValues: unknown[] = [projectId];
  if (experimentIds.length) { findingConditions.push(`experiment_id IN (${placeholders(experimentIds)})`); findingValues.push(...experimentIds); }
  if (runIds.length) { findingConditions.push(`run_id IN (${placeholders(runIds)})`); findingValues.push(...runIds); }
  const findings = sqlite.prepare(`SELECT * FROM findings WHERE archived_at IS NULL AND (${findingConditions.join(" OR ")}) ORDER BY updated_at DESC`).all(...findingValues) as Row[];

  const artifactConditions = ["project_id=?"]; const artifactValues: unknown[] = [projectId];
  if (experimentIds.length) { artifactConditions.push(`experiment_id IN (${placeholders(experimentIds)})`); artifactValues.push(...experimentIds); }
  if (runIds.length) { artifactConditions.push(`run_id IN (${placeholders(runIds)})`); artifactValues.push(...runIds); }
  const artifacts = sqlite.prepare(`SELECT * FROM artifacts WHERE archived_at IS NULL AND (${artifactConditions.join(" OR ")}) ORDER BY updated_at DESC`).all(...artifactValues) as Row[];

  const chain = [
    ["projects", [projectRow]],
    ["questions", questions],
    ["hypotheses", hypotheses],
    ["experiments", experiments],
    ["runs", runs],
    ["findings", findings],
    ["artifacts", artifacts],
  ] as const;

  const pairs: { type: string; id: string }[] = [];
  for (const [type, items] of chain) for (const item of items) pairs.push({ type, id: String(item.id) });
  const taskClauses = pairs.map(() => "(entity_type=? AND entity_id=?)");
  const taskValues = pairs.flatMap((item) => [item.type, item.id]);
  const tasks = taskClauses.length
    ? sqlite.prepare(`SELECT * FROM tasks WHERE archived_at IS NULL AND (${taskClauses.join(" OR ")}) ORDER BY status='done',due_at IS NULL,due_at`).all(...taskValues) as Row[]
    : [];

  const links = sqlite.prepare("SELECT * FROM research_links ORDER BY created_at DESC").all() as Row[];
  const pairSet = new Set(pairs.map((item) => `${item.type}:${item.id}`));
  const relevantLinks = links.filter((link) =>
    pairSet.has(`${String(link.source_type)}:${String(link.source_id)}`) ||
    pairSet.has(`${String(link.target_type)}:${String(link.target_id)}`)
  );

  const outputRefs = new Map<string,{ type:"papers"|"patents"; id:string; relation:string; viaType:string; viaId:string }>();
  for (const link of relevantLinks) {
    const sourceKey = `${String(link.source_type)}:${String(link.source_id)}`;
    const targetKey = `${String(link.target_type)}:${String(link.target_id)}`;
    const sourceInChain = pairSet.has(sourceKey); const targetInChain = pairSet.has(targetKey);
    const otherType = sourceInChain ? String(link.target_type) : targetInChain ? String(link.source_type) : "";
    const otherId = sourceInChain ? String(link.target_id) : targetInChain ? String(link.source_id) : "";
    if (otherType !== "papers" && otherType !== "patents") continue;
    const viaType = sourceInChain ? String(link.source_type) : String(link.target_type);
    const viaId = sourceInChain ? String(link.source_id) : String(link.target_id);
    outputRefs.set(`${otherType}:${otherId}`, { type: otherType, id: otherId, relation: String(link.relation), viaType, viaId });
  }

  const relatedOutputs = [...outputRefs.values()].map((ref) => {
    const table = ref.type === "papers" ? "papers" : "patents";
    const row = sqlite.prepare(`SELECT * FROM ${table} WHERE id=? AND archived_at IS NULL`).get(ref.id) as Row | undefined;
    return row ? { ...ref, item: fromDatabase(ref.type, row) } : null;
  }).filter(Boolean);

  return {
    project: fromDatabase("projects", projectRow),
    questions: questions.map((row) => fromDatabase("questions", row)),
    hypotheses: hypotheses.map((row) => fromDatabase("hypotheses", row)),
    experiments: experiments.map((row) => fromDatabase("experiments", row)),
    runs: runs.map((row) => fromDatabase("runs", row)),
    findings: findings.map((row) => fromDatabase("findings", row)),
    artifacts: artifacts.map((row) => fromDatabase("artifacts", row)),
    tasks,
    links: relevantLinks,
    relatedOutputs,
    summary: {
      questions: questions.length,
      hypotheses: hypotheses.length,
      experiments: experiments.length,
      runs: runs.length,
      findings: findings.length,
      artifacts: artifacts.length,
      tasks: tasks.length,
      relatedOutputs: relatedOutputs.length,
    },
  };
}
