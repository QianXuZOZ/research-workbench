import { z } from "zod";

export const recordTypes = ["projects", "papers", "literature", "patents", "growth"] as const;
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
  patents: "patents",
  growth: "growth_items",
};

export const recordLabels: Record<RecordType, string> = {
  projects: "项目",
  papers: "论文成果",
  literature: "文献",
  patents: "专利",
  growth: "成长记录",
};

const columnMaps: Record<RecordType, Record<string, string>> = {
  projects: { title: "title", code: "code", category: "category", role: "role", status: "status", startDate: "start_date", endDate: "end_date", completedAt: "completed_at", funding: "funding", leader: "leader", members: "members", progress: "progress", risk: "risk", summary: "summary", notes: "notes", keywords: "keywords" },
  papers: { title: "title", authors: "authors", authorRole: "author_role", venue: "venue", venueType: "venue_type", status: "status", year: "year", submittedAt: "submitted_at", acceptedAt: "accepted_at", publishedAt: "published_at", doi: "doi", journalQuartile: "journal_quartile", casQuartile: "cas_quartile", impactFactor: "impact_factor", abstract: "abstract", keywords: "keywords", notes: "notes", bibtex: "bibtex" },
  literature: { title: "title", authors: "authors", venue: "venue", venueType: "venue_type", status: "status", year: "year", doi: "doi", url: "url", abstract: "abstract", keywords: "keywords", notes: "notes", bibtex: "bibtex" },
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
