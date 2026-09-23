export type FieldConfig = { key: string; label: string; type?: "text" | "textarea" | "select" | "date" | "number"; required?: boolean; placeholder?: string; options?: [string, string][]; wide?: boolean };
export type ModuleConfig = { type: "projects" | "papers" | "literature" | "patents" | "growth"; title: string; singular: string; description: string; addLabel: string; emptyTitle: string; emptyDescription: string; fields: FieldConfig[]; columns: { key: string; label: string }[]; statusOptions: [string, string][] };

export const modules: Record<string, ModuleConfig> = {
  projects: {
    type: "projects", title: "项目管理", singular: "项目", description: "把研究计划、节点、风险和成果放进同一条推进链。", addLabel: "新建项目", emptyTitle: "建立第一个项目", emptyDescription: "记录起止时间、研究角色和关键节点，任务与成果将围绕项目汇聚。",
    statusOptions: [["planning", "筹备"], ["active", "进行中"], ["paused", "暂停"], ["completed", "已结项"]],
    columns: [{ key: "title", label: "项目" }, { key: "status", label: "状态" }, { key: "role", label: "角色" }, { key: "progress", label: "进度" }, { key: "endDate", label: "截止" }],
    fields: [
      { key: "title", label: "项目名称", required: true, wide: true }, { key: "code", label: "项目编号" }, { key: "category", label: "项目类别", type: "select", options: [["纵向项目", "纵向项目"], ["横向项目", "横向项目"], ["校级项目", "校级项目"], ["内部研究", "内部研究"]] },
      { key: "role", label: "承担角色", type: "select", options: [["负责人", "负责人"], ["骨干", "骨干"], ["参与人", "参与人"], ["顾问", "顾问"]] }, { key: "status", label: "状态", type: "select", options: [["planning", "筹备"], ["active", "进行中"], ["paused", "暂停"], ["completed", "已结项"]] }, { key: "risk", label: "风险", type: "select", options: [["normal", "正常"], ["watch", "关注"], ["high", "高风险"]] },
      { key: "startDate", label: "开始日期", type: "date" }, { key: "endDate", label: "截止日期", type: "date" }, { key: "completedAt", label: "结项日期", type: "date" }, { key: "progress", label: "完成进度 (%)", type: "number" }, { key: "funding", label: "经费（万元）", type: "number" },
      { key: "leader", label: "负责人" }, { key: "members", label: "项目成员", placeholder: "使用分号分隔" }, { key: "keywords", label: "研究方向标签", placeholder: "如：新能源并网；继电保护", wide: true }, { key: "summary", label: "项目摘要", type: "textarea", wide: true }, { key: "notes", label: "推进备注", type: "textarea", wide: true },
    ],
  },
  papers: {
    type: "papers", title: "论文管理", singular: "论文", description: "跟踪从选题、撰写到投稿、返修与发表的完整过程。", addLabel: "新建论文", emptyTitle: "录入第一篇论文", emptyDescription: "手动录入或导入 BibTeX，后续可关联项目、任务和投稿材料。",
    statusOptions: [["idea", "选题"], ["drafting", "撰写"], ["submitted", "已投稿"], ["revision", "返修"], ["accepted", "已录用"], ["published", "已发表"], ["rejected", "退稿"]],
    columns: [{ key: "title", label: "论文" }, { key: "status", label: "阶段" }, { key: "venue", label: "期刊 / 会议" }, { key: "authorRole", label: "作者角色" }, { key: "year", label: "年份" }],
    fields: [
      { key: "title", label: "论文题目", required: true, wide: true }, { key: "authors", label: "作者", placeholder: "使用分号分隔", wide: true }, { key: "authorRole", label: "作者角色", type: "select", options: [["第一作者", "第一作者"], ["通讯作者", "通讯作者"], ["共同一作", "共同一作"], ["合作作者", "合作作者"]] },
      { key: "venue", label: "期刊 / 会议" }, { key: "venueType", label: "类型", type: "select", options: [["journal", "期刊"], ["conference", "会议"], ["preprint", "预印本"], ["thesis", "学位论文"]] }, { key: "status", label: "投稿阶段", type: "select", options: [["idea", "选题"], ["drafting", "撰写"], ["submitted", "已投稿"], ["revision", "返修"], ["accepted", "已录用"], ["published", "已发表"], ["rejected", "退稿"]] },
      { key: "year", label: "年份", type: "number" }, { key: "doi", label: "DOI" }, { key: "journalQuartile", label: "JCR 分区" }, { key: "casQuartile", label: "中科院分区" }, { key: "impactFactor", label: "影响因子", type: "number" },
      { key: "submittedAt", label: "投稿日期", type: "date" }, { key: "acceptedAt", label: "录用日期", type: "date" }, { key: "publishedAt", label: "发表日期", type: "date" }, { key: "keywords", label: "关键词", wide: true }, { key: "abstract", label: "摘要", type: "textarea", wide: true }, { key: "notes", label: "备注", type: "textarea", wide: true },
    ],
  },
  literature: {
    type: "literature", title: "文献库", singular: "文献", description: "管理外部参考文献、阅读状态与研究笔记，与自己的论文成果分开统计。", addLabel: "新建文献", emptyTitle: "建立第一条文献记录", emptyDescription: "手动录入或导入 BibTeX，后续可关联项目、论文成果、任务与附件。",
    statusOptions: [["unread", "待读"], ["reading", "在读"], ["read", "已读"]],
    columns: [{ key: "title", label: "文献" }, { key: "status", label: "阅读状态" }, { key: "venue", label: "期刊 / 会议" }, { key: "year", label: "年份" }, { key: "doi", label: "DOI" }],
    fields: [
      { key: "title", label: "文献题目", required: true, wide: true }, { key: "authors", label: "作者", placeholder: "使用分号分隔", wide: true }, { key: "venue", label: "期刊 / 会议" },
      { key: "venueType", label: "类型", type: "select", options: [["journal", "期刊"], ["conference", "会议"], ["preprint", "预印本"], ["book", "图书"], ["thesis", "学位论文"], ["other", "其他"]] }, { key: "status", label: "阅读状态", type: "select", options: [["unread", "待读"], ["reading", "在读"], ["read", "已读"]] },
      { key: "year", label: "年份", type: "number" }, { key: "doi", label: "DOI" }, { key: "url", label: "链接", wide: true }, { key: "keywords", label: "关键词", wide: true }, { key: "abstract", label: "摘要", type: "textarea", wide: true }, { key: "notes", label: "阅读笔记", type: "textarea", wide: true },
    ],
  },
  patents: {
    type: "patents", title: "专利管理", singular: "专利", description: "集中管理交底、申请、审查、授权与年费节点。", addLabel: "新建专利", emptyTitle: "录入第一项专利", emptyDescription: "从技术交底开始记录法律状态、申请编号和关联成果。",
    statusOptions: [["drafting", "交底撰写"], ["filed", "已申请"], ["published", "已公开"], ["examining", "实质审查"], ["granted", "已授权"], ["rejected", "驳回"], ["expired", "失效"]],
    columns: [{ key: "title", label: "专利" }, { key: "status", label: "法律状态" }, { key: "applicationNumber", label: "申请号" }, { key: "inventors", label: "发明人" }, { key: "feeDueAt", label: "下一节点" }],
    fields: [
      { key: "title", label: "专利名称", required: true, wide: true }, { key: "patentType", label: "专利类型", type: "select", options: [["invention", "发明专利"], ["utility", "实用新型"], ["design", "外观设计"], ["software", "软件著作权"]] }, { key: "status", label: "法律状态", type: "select", options: [["drafting", "交底撰写"], ["filed", "已申请"], ["published", "已公开"], ["examining", "实质审查"], ["granted", "已授权"], ["rejected", "驳回"], ["expired", "失效"]] },
      { key: "applicationNumber", label: "申请号" }, { key: "publicationNumber", label: "公开号" }, { key: "inventors", label: "发明人", wide: true }, { key: "applicant", label: "申请人" }, { key: "agency", label: "代理机构" },
      { key: "filedAt", label: "申请日期", type: "date" }, { key: "publishedAt", label: "公开日期", type: "date" }, { key: "grantedAt", label: "授权日期", type: "date" }, { key: "feeDueAt", label: "缴费 / 下一节点", type: "date" }, { key: "keywords", label: "关键词", wide: true }, { key: "abstract", label: "摘要", type: "textarea", wide: true }, { key: "notes", label: "备注", type: "textarea", wide: true },
    ],
  },
  growth: {
    type: "growth", title: "个人成长", singular: "成长记录", description: "把学习、学术服务与能力提升转化为可回顾的进展。", addLabel: "新建成长项", emptyTitle: "设定第一个成长目标", emptyDescription: "从一门课程、一项技能或一次学术服务开始，保留过程和证明。",
    statusOptions: [["planned", "计划中"], ["active", "进行中"], ["completed", "已完成"], ["paused", "暂停"]],
    columns: [{ key: "title", label: "成长事项" }, { key: "category", label: "类别" }, { key: "status", label: "状态" }, { key: "currentValue", label: "进度值" }, { key: "dueAt", label: "截止" }],
    fields: [
      { key: "title", label: "事项名称", required: true, wide: true }, { key: "category", label: "类别", type: "select", options: [["skill", "技能"], ["course", "课程"], ["training", "培训"], ["conference", "会议"], ["certificate", "证书"], ["award", "奖励"], ["service", "学术服务"], ["review", "阶段复盘"]] }, { key: "status", label: "状态", type: "select", options: [["planned", "计划中"], ["active", "进行中"], ["completed", "已完成"], ["paused", "暂停"]] },
      { key: "startedAt", label: "开始日期", type: "date" }, { key: "dueAt", label: "截止日期", type: "date" }, { key: "completedAt", label: "完成日期", type: "date" }, { key: "targetValue", label: "目标值", type: "number" }, { key: "currentValue", label: "当前值", type: "number" }, { key: "unit", label: "单位" }, { key: "provider", label: "机构 / 来源" },
      { key: "keywords", label: "标签", wide: true }, { key: "evidence", label: "成果或证明", type: "textarea", wide: true }, { key: "notes", label: "复盘记录", type: "textarea", wide: true },
    ],
  },
};

export const statusLabel = Object.fromEntries(Object.values(modules).flatMap((module) => module.statusOptions));
