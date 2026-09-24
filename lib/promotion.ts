import { sqlite } from "@/lib/db";
import { clamp } from "@/lib/utils";

type MetricRow = Record<string, unknown>;

const sourceTables: Record<string, string> = { projects: "projects", papers: "papers", patents: "patents", growth: "growth_items" };
const sourceDateFields: Record<string, string> = { projects: "completed_at", papers: "published_at", patents: "granted_at", growth: "completed_at" };
const allowedFields: Record<string, string[]> = {
  projects: ["funding", "progress"],
  papers: ["impact_factor"],
  patents: [],
  growth: ["current_value", "target_value"],
};

export function computeMetric(metric: MetricRow, cycle?: MetricRow) {
  const sourceType = String(metric.source_type);
  let current = Number(metric.manual_value ?? 0);
  let evidence: { id: string; title: string; date: string | null }[] = [];
  if (sourceTables[sourceType]) {
    let filter: { status?: string; field?: string; category?: string } = {};
    try { filter = metric.source_filter ? JSON.parse(String(metric.source_filter)) : {}; } catch { filter = {}; }
    const where = ["archived_at IS NULL"];
    const values: unknown[] = [];
    if (filter.status) { where.push("status = ?"); values.push(filter.status); }
    if (filter.category && ["projects", "growth"].includes(sourceType)) { where.push("category = ?"); values.push(filter.category); }

    const dateField = sourceDateFields[sourceType];
    const startsAt = cycle?.starts_at ? String(cycle.starts_at) : null;
    const dueAt = cycle?.due_at ? String(cycle.due_at) : null;
    if (startsAt && dateField) { where.push(`${dateField} IS NOT NULL AND ${dateField} >= ?`); values.push(startsAt); }
    if (dueAt && dateField) { where.push(`${dateField} IS NOT NULL AND ${dateField} <= ?`); values.push(dueAt); }

    const field = filter.field && allowedFields[sourceType]?.includes(filter.field) ? filter.field : null;
    if (String(metric.metric_type) === "number" && field) {
      current = Number((sqlite.prepare(`SELECT COALESCE(SUM(${field}), 0) AS value FROM ${sourceTables[sourceType]} WHERE ${where.join(" AND ")}`).get(...values) as { value: number }).value);
    } else {
      current = Number((sqlite.prepare(`SELECT COUNT(*) AS value FROM ${sourceTables[sourceType]} WHERE ${where.join(" AND ")}`).get(...values) as { value: number }).value);
    }
    evidence = sqlite.prepare(`SELECT id,title,${dateField ?? "NULL"} AS date FROM ${sourceTables[sourceType]} WHERE ${where.join(" AND ")} ORDER BY ${dateField ?? "updated_at"} DESC LIMIT 100`)
      .all(...values) as { id: string; title: string; date: string | null }[];
  }

  const manualEvidence = metric.id ? sqlite.prepare("SELECT entity_type AS entityType,entity_id AS entityId,note,created_at AS createdAt FROM promotion_evidence_links WHERE metric_id=? ORDER BY created_at DESC").all(metric.id) : [];
  const target = Math.max(0, Number(metric.target_value ?? 0));
  const ratio = target === 0 ? 1 : clamp(current / target, 0, 1);
  const score = ratio * Number(metric.weight ?? 1);
  return { current, target, ratio, score, met: current >= target, evidence, manualEvidence };
}

export function getPromotionOverview() {
  const cycles = sqlite.prepare("SELECT * FROM promotion_cycles WHERE archived_at IS NULL ORDER BY status = 'active' DESC, due_at IS NULL, due_at").all() as MetricRow[];
  return cycles.map((cycle) => {
    const metrics = sqlite.prepare("SELECT * FROM promotion_metrics WHERE cycle_id = ? AND archived_at IS NULL ORDER BY required DESC, category, created_at").all(cycle.id) as MetricRow[];
    const computed: Array<MetricRow & ReturnType<typeof computeMetric>> = metrics.map((metric) => ({ ...metric, ...computeMetric(metric, cycle) }));
    const totalWeight = computed.reduce((sum, metric) => sum + Number(metric.weight), 0);
    const earned = computed.reduce((sum, metric) => sum + metric.score, 0);
    return {
      ...cycle,
      metrics: computed,
      progress: totalWeight ? Math.round((earned / totalWeight) * 100) : 0,
      requiredGaps: computed.filter((metric) => Boolean(metric.required) && !metric.met).length,
    };
  });
}
