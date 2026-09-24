import { z } from "zod";

export const recordTypes = ["projects", "papers", "literature", "questions", "hypotheses", "experiments", "runs", "findings", "artifacts", "patents", "growth"] as const;
export type RecordType = (typeof recordTypes)[number];

const optionalText = z.string().trim().max(5000).nullable().optional();
const optionalDate = z.string().trim().max(40).nullable().optional();
const optionalNumber = z.coerce.number().finite().nullable().optional();

const base = {
  title: z.string().trim().min(1, "请输入标题").max(300),
  notes: optionalText,
  keywords: z.string().trim().max(800).nullable().optional(),
};

export const recordSchemas = {
  projects: z.object({
    ...base,
    code: z.string().trim().max(100).nullable().optional(),
    category: z.string().trim().max(100).default("纵向项目"),
    role: z.string().trim().max(100).default("负责人"),
    status: z.enum(["planning", "active", "paused", "completed"]).default("planning"),
    startDate: optionalDate,
    endDate: optionalDate,
    completedAt: optionalDate,
    funding: optionalNumber,
    leader: optionalText,
    members: optionalText,
    progress: z.coerce.number().int().min(0).max(100).default(0),
    risk: z.enum(["normal", "watch", "high"]).default("normal"),
    summary: optionalText,
  }),
  papers: z.object({
    ...base,
    authors: optionalText,
    authorRole: optionalText,
    venue: optionalText,
    venueType: z.enum(["journal", "conference", "preprint", "thesis"]).default("journal"),
    status: z.enum(["idea", "drafting", "submitted", "revision", "accepted", "published", "rejected"]).default("idea"),
    year: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
    submittedAt: optionalDate,
    acceptedAt: optionalDate,
    publishedAt: optionalDate,
    doi: z.string().trim().max(300).nullable().optional(),
    journalQuartile: optionalText,
    casQuartile: optionalText,
    impactFactor: optionalNumber,
    abstract: optionalText,
    bibtex: z.string().max(30000).nullable().optional(),
  }),
  literature: z.object({
    ...base,
    authors: optionalText,
    venue: optionalText,
    venueType: z.enum(["journal", "conference", "preprint", "book", "thesis", "other"]).default("journal"),
    status: z.enum(["unread", "reading", "read"]).default("unread"),
    year: z.coerce.number().int().min(1900).max(2200).nullable().optional(),
    doi: z.string().trim().max(300).nullable().optional(),
    url: z.string().trim().max(2000).nullable().optional(),
    abstract: optionalText,
    bibtex: z.string().max(100000).nullable().optional(),
  }),
  questions: z.object({
    ...base,
    projectId: z.string().uuid().nullable().optional(),
    status: z.enum(["open", "investigating", "answered", "parked"]).default("open"),
    context: optionalText,
    successCriteria: optionalText,
  }),
  hypotheses: z.object({
    ...base,
    projectId: z.string().uuid().nullable().optional(),
    questionId: z.string().uuid().nullable().optional(),
    status: z.enum(["proposed", "testing", "supported", "rejected", "revised"]).default("proposed"),
    rationale: optionalText,
    prediction: optionalText,
  }),
  experiments: z.object({
    ...base,
    projectId: z.string().uuid().nullable().optional(),
    hypothesisId: z.string().uuid().nullable().optional(),
    status: z.enum(["planned", "running", "completed", "failed", "cancelled"]).default("planned"),
    method: optionalText,
    platform: optionalText,
    variables: optionalText,
    expectedResult: optionalText,
  }),
  runs: z.object({
    ...base,
    experimentId: z.string().uuid().nullable().optional(),
    status: z.enum(["planned", "running", "completed", "failed"]).default("planned"),
    runAt: optionalDate,
    parameters: z.string().max(20000).nullable().optional(),
    resultSummary: optionalText,
    errorMetric: optionalNumber,
  }),
  findings: z.object({
    ...base,
    projectId: z.string().uuid().nullable().optional(),
    experimentId: z.string().uuid().nullable().optional(),
    runId: z.string().uuid().nullable().optional(),
    status: z.enum(["candidate", "validated", "contradicted", "published"]).default("candidate"),
    claim: optionalText,
    evidence: optionalText,
    confidence: z.coerce.number().int().min(0).max(100).default(50),
  }),
  artifacts: z.object({
    ...base,
    projectId: z.string().uuid().nullable().optional(),
    experimentId: z.string().uuid().nullable().optional(),
    runId: z.string().uuid().nullable().optional(),
    artifactType: z.enum(["matlab", "pscad", "dataset", "figure", "document", "repository", "folder", "other"]).default("document"),
    storageType: z.enum(["upload", "local_path", "network_path", "github", "url"]).default("upload"),
    location: z.string().trim().max(4000).nullable().optional(),
    version: z.string().trim().max(100).nullable().optional(),
    checksum: z.string().trim().max(200).nullable().optional(),
  }),
  patents: z.object({
    ...base,
    patentType: z.enum(["invention", "utility", "design", "software"]).default("invention"),
    status: z.enum(["drafting", "filed", "published", "examining", "granted", "rejected", "expired"]).default("drafting"),
    applicationNumber: optionalText,
    publicationNumber: optionalText,
    inventors: optionalText,
    applicant: optionalText,
    agency: optionalText,
    filedAt: optionalDate,
    publishedAt: optionalDate,
    grantedAt: optionalDate,
    feeDueAt: optionalDate,
    abstract: optionalText,
  }),
  growth: z.object({
    ...base,
    category: z.enum(["skill", "course", "training", "conference", "certificate", "award", "service", "review"]).default("skill"),
    status: z.enum(["planned", "active", "completed", "paused"]).default("planned"),
    startedAt: optionalDate,
    dueAt: optionalDate,
    completedAt: optionalDate,
    targetValue: optionalNumber,
    currentValue: z.coerce.number().finite().default(0),
    unit: optionalText,
    provider: optionalText,
    evidence: optionalText,
  }),
} satisfies Record<RecordType, z.ZodTypeAny>;

export const recordTables: Record<RecordType, string> = {
  projects: "projects",
  papers: "papers",
  literature: "literature_items",
  questions: "research_questions",
  hypotheses: "hypotheses",
  experiments: "experiments",
  runs: "experiment_runs",
  findings: "findings",
  artifacts: "artifacts",
  patents: "patents",
  growth: "growth_items",
};

export const recordLabels: Record<RecordType, string> = {
  projects: "项目",
  papers: "论文成果",
  literature: "文献",
  questions: "研究问题",
  hypotheses: "研究假设",
  experiments: "实验",
  runs: "实验运行",
  findings: "研究发现",
  artifacts: "科研资产",
  patents: "专利",
  growth: "成长记录",
};

const columnMaps: Record<RecordType, Record<string, string>> = {
  projects: { title: "title", code: "code", category: "category", role: "role", status: "status", startDate: "start_date", endDate: "end_date", completedAt: "completed_at", funding: "funding", leader: "leader", members: "members", progress: "progress", risk: "risk", summary: "summary", notes: "notes", keywords: "keywords" },
  papers: { title: "title", authors: "authors", authorRole: "author_role", venue: "venue", venueType: "venue_type", status: "status", year: "year", submittedAt: "submitted_at", acceptedAt: "accepted_at", publishedAt: "published_at", doi: "doi", journalQuartile: "journal_quartile", casQuartile: "cas_quartile", impactFactor: "impact_factor", abstract: "abstract", keywords: "keywords", notes: "notes", bibtex: "bibtex" },
  literature: { title: "title", authors: "authors", venue: "venue", venueType: "venue_type", status: "status", year: "year", doi: "doi", url: "url", abstract: "abstract", keywords: "keywords", notes: "notes", bibtex: "bibtex" },
  questions: { title: "title", projectId: "project_id", status: "status", context: "context", successCriteria: "success_criteria", keywords: "keywords", notes: "notes" },
  hypotheses: { title: "title", projectId: "project_id", questionId: "question_id", status: "status", rationale: "rationale", prediction: "prediction", keywords: "keywords", notes: "notes" },
  experiments: { title: "title", projectId: "project_id", hypothesisId: "hypothesis_id", status: "status", method: "method", platform: "platform", variables: "variables", expectedResult: "expected_result", keywords: "keywords", notes: "notes" },
  runs: { title: "title", experimentId: "experiment_id", status: "status", runAt: "run_at", parameters: "parameters", resultSummary: "result_summary", errorMetric: "error_metric", keywords: "keywords", notes: "notes" },
  findings: { title: "title", projectId: "project_id", experimentId: "experiment_id", runId: "run_id", status: "status", claim: "claim", evidence: "evidence", confidence: "confidence", keywords: "keywords", notes: "notes" },
  artifacts: { title: "title", projectId: "project_id", experimentId: "experiment_id", runId: "run_id", artifactType: "artifact_type", storageType: "storage_type", location: "location", version: "version", checksum: "checksum", keywords: "keywords", notes: "notes" },
  patents: { title: "title", patentType: "patent_type", status: "status", applicationNumber: "application_number", publicationNumber: "publication_number", inventors: "inventors", applicant: "applicant", agency: "agency", filedAt: "filed_at", publishedAt: "published_at", grantedAt: "granted_at", feeDueAt: "fee_due_at", abstract: "abstract", keywords: "keywords", notes: "notes" },
  growth: { title: "title", category: "category", status: "status", startedAt: "started_at", dueAt: "due_at", completedAt: "completed_at", targetValue: "target_value", currentValue: "current_value", unit: "unit", provider: "provider", evidence: "evidence", notes: "notes", keywords: "keywords" },
};

export function toDatabase(type: RecordType, value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => columnMaps[type][key]).map(([key, val]) => [columnMaps[type][key], val === "" ? null : val]));
}

export function fromDatabase(type: RecordType, value: Record<string, unknown>) {
  const reverse = Object.fromEntries(Object.entries(columnMaps[type]).map(([a, b]) => [b, a]));
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [reverse[key] ?? key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), val]));
}

export function isRecordType(value: string): value is RecordType {
  return recordTypes.includes(value as RecordType);
}
