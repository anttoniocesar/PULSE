import { formatNumber, getDashboardData, stages, type Initiative, type Period, type Unit } from "../data/demoData";
import { dimensionLabels, overviewIntegration, overviewRules, type CaptureRecord, type ExecutiveRecord, type HealthDimension, type HealthLevel, type OverviewIntegration, type OverviewRules, type Thresholds } from "../data/overviewData";

const dimensions: HealthDimension[] = ["schedule", "financial", "risk"];
const severity: Record<HealthLevel, number> = { onTrack: 0, attention: 1, critical: 2 };
const known = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const validLevel = (value: string): value is HealthLevel => Object.hasOwn(severity, value);
export function parseReportingDate(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value ? date : null;
}
export function uniqueById<T>(items: readonly T[], id: (item: T) => string): T[] {
  return [...new Map(items.filter(item => !!id(item)).map(item => [id(item), item])).values()];
}
function thresholdLevel(value: number, limits: Thresholds | null): HealthLevel | null {
  if (!known(value) || !limits || !known(limits.attention) || !known(limits.critical) || limits.attention <= 0 || limits.critical <= limits.attention) return null;
  return value >= limits.critical ? "critical" : value >= limits.attention ? "attention" : "onTrack";
}
export type DimensionAssessment = { dimension: HealthDimension; level: HealthLevel | null; reason: string };
export function classifyInitiative(record: ExecutiveRecord | undefined, rules: OverviewRules, referenceDate: string | null) {
  const asOf = parseReportingDate(referenceDate);
  const assessments: DimensionAssessment[] = dimensions.map(dimension => {
    const explicit = record?.assessments?.[dimension];
    if (explicit && validLevel(explicit.level)) return { dimension, level: explicit.level, reason: explicit.reason || "Classificação informada pela fonte." };
    let level: HealthLevel | null = null;
    let detail = "";
    if (dimension === "schedule" && record?.schedule && asOf !== null) {
      const due = parseReportingDate(record.schedule.dueDate);
      const completed = record.schedule.completedAt === null ? asOf : parseReportingDate(record.schedule.completedAt);
      if (due !== null && completed !== null && completed <= asOf) {
        const delay = Math.max(0, (completed - due) / 86_400_000);
        level = thresholdLevel(delay, rules.scheduleDelayDays);
        detail = `Prazo: ${formatNumber(delay, 0)} dias de atraso frente ao marco previsto.`;
      }
    }
    if (dimension === "financial" && record?.financial) {
      const { expected, actual } = record.financial;
      if (known(expected) && expected > 0 && known(actual)) {
        const shortfall = Math.max(0, (expected - actual) / expected * 100);
        level = Number.isFinite((expected - actual) / expected * 100) ? thresholdLevel(shortfall, rules.financialShortfallPercent) : null;
        detail = `Resultado financeiro: ${formatNumber(shortfall)}% abaixo do esperado.`;
      }
    }
    if (dimension === "risk" && known(record?.riskScore) && record.riskScore >= 0) {
      level = thresholdLevel(record.riskScore, rules.riskScore);
      detail = `Risco: pontuação ${formatNumber(record.riskScore)}, conforme critérios configurados.`;
    }
    return { dimension, level, reason: level ? detail : `${dimensionLabels[dimension]}: dados válidos ou critérios de classificação não informados.` };
  });
  const available = assessments.filter(item => item.level !== null);
  const worst = available.reduce<DimensionAssessment | null>((current, item) => !current || severity[item.level!] > severity[current.level!] ? item : current, null);
  const overall = available.length === dimensions.length ? worst!.level : null;
  return { assessments, coverage: available.length, overall, observed: worst?.level ?? null, reason: overall ? worst!.reason : "Avaliação incompleta: " + assessments.filter(item => item.level === null).map(item => dimensionLabels[item.dimension]).join(", ") + "." };
}
export type InitiativeHealth = ReturnType<typeof classifyInitiative> & { initiative: Initiative; updatedAt: string | null };

export function aggregateMaturity(initiatives: readonly Initiative[]) {
  const unique = uniqueById(initiatives, item => item.id);
  return { stages: stages.map(stage => {
    const count = unique.filter(item => item.stage === stage).length;
    return { stage, count, percent: unique.length ? count / unique.length * 100 : 0 };
  }), unclassified: unique.filter(item => !stages.includes(item.stage)).length };
}

export type AlertKind = "critical" | "milestones" | "decisions" | "stale";
export type ExecutiveAlert = { id: string; initiative: Initiative; description: string; owner: string | null; dueDate: string | null; status: string; action: string };
export type AlertGroup = { kind: AlertKind; alerts: ExecutiveAlert[]; count: number | null; coverage: number; total: number; note: string };
export function identifyOverdueMilestones(record: ExecutiveRecord | undefined, referenceDate: string | null) {
  const asOf = parseReportingDate(referenceDate);
  if (asOf === null || !record?.milestones) return null;
  return uniqueById(record.milestones, item => item.id).filter(item => item.status === "pending" && parseReportingDate(item.dueDate) !== null && parseReportingDate(item.dueDate)! < asOf);
}
export function identifyPendingDecisions(record: ExecutiveRecord | undefined) {
  return record?.decisions ? uniqueById(record.decisions, item => item.id).filter(item => item.status === "pending") : null;
}
export function isOutdated(updatedAt: string | null | undefined, referenceDate: string | null, limit: number | null): boolean | null {
  const updated = parseReportingDate(updatedAt), asOf = parseReportingDate(referenceDate);
  if (updated === null || asOf === null || updated > asOf || !known(limit) || limit <= 0) return null;
  return (asOf - updated) / 86_400_000 > limit;
}
function executiveAlerts(health: InitiativeHealth[], records: Map<string, ExecutiveRecord>, referenceDate: string | null, rules: OverviewRules): AlertGroup[] {
  return (["critical", "milestones", "decisions", "stale"] as const).map(kind => {
    const alerts: ExecutiveAlert[] = [];
    let coverage = 0;
    for (const assessment of health) {
      const initiative = assessment.initiative, record = records.get(initiative.id);
      const add = (id: string, description: string, owner: string | null | undefined, dueDate: string | null | undefined, status: string, action: string) => alerts.push({ id: `${initiative.id}:${kind}:${id}`, initiative, description, owner: owner || initiative.owner || null, dueDate: parseReportingDate(dueDate) === null ? null : dueDate!, status, action });
      if (kind === "critical" && assessment.overall !== null) {
        coverage++;
        if (assessment.overall === "critical") add(initiative.id, assessment.reason, initiative.owner, record?.schedule?.dueDate, "Crítico", "Avaliar o desvio e definir plano de recuperação.");
      }
      if (kind === "milestones") {
        const overdue = identifyOverdueMilestones(record, referenceDate);
        const valid = record?.milestones?.every(item => ["pending", "completed", "cancelled"].includes(item.status) && (item.status !== "pending" || parseReportingDate(item.dueDate) !== null));
        if (overdue !== null && valid) coverage++;
        for (const milestone of overdue ?? []) add(milestone.id, milestone.name, milestone.owner, milestone.dueDate, "Marco vencido", "Revisar o marco e acordar o plano de recuperação.");
      }
      if (kind === "decisions") {
        const pending = identifyPendingDecisions(record);
        if (pending !== null && record?.decisions?.every(item => ["pending", "resolved", "cancelled"].includes(item.status))) coverage++;
        for (const decision of pending ?? []) add(decision.id, decision.description, decision.owner, decision.dueDate, "Decisão pendente", decision.action || "Deliberar e registrar a decisão.");
      }
      if (kind === "stale") {
        const stale = isOutdated(record?.updatedAt, referenceDate, rules.staleAfterDays);
        if (stale !== null) coverage++;
        if (stale) add(initiative.id, `Registro sem atualização há mais de ${rules.staleAfterDays} dias.`, initiative.owner, null, "Atualização vencida", "Atualizar o registro e confirmar o andamento da iniciativa.");
      }
    }
    const total = health.length;
    const count = coverage || alerts.length || total === 0 ? alerts.length : null;
    const note = kind === "critical" ? "Requer avaliação completa de prazo, resultado financeiro e risco." : kind === "milestones" ? "Requer marcos com situação, vencimento e data de referência da fonte." : kind === "decisions" ? "Requer decisões e situações registradas na fonte." : "Requer última atualização, data de referência e limite de dias configurado.";
    return { kind, alerts, count, coverage, total, note };
  });
}

export function calculateCaptureAccumulated(records: readonly CaptureRecord[], unit: Unit, scope: Period) {
  const units = unit === "all" ? ["A", "B"] : [unit];
  const selected = uniqueById(records, item => item.id).filter(item => units.includes(item.unit) && item.scope === scope && /^2026-(0[1-9]|1[0-2])$/.test(item.month) && (scope === "FY" || item.month <= "2026-09"));
  const months = [...new Set(selected.map(item => item.month))].sort();
  return months.map(month => {
    const rows = units.map(selectedUnit => selected.filter(item => item.unit === selectedUnit && item.month === month));
    const sum = (key: "plannedCumulative" | "actualCumulative" | "forecastCumulative") => {
      if (!rows.every(items => items.length === 1 && known(items[0][key]))) return null;
      const total = rows.reduce((value, items) => value + items[0][key]!, 0);
      return known(total) ? total : null;
    };
    const planned = sum("plannedCumulative"), realized = sum("actualCumulative"), forecast = sum("forecastCumulative");
    const difference = planned !== null && realized !== null ? realized - planned : null;
    const variance = known(difference) ? difference : null;
    const percent = variance !== null && planned !== null && planned !== 0 ? variance / Math.abs(planned) * 100 : null;
    return { month, planned, realized, forecast, variance, variancePercent: known(percent) ? percent : null };
  });
}

export function getOverviewData(unit: Unit, period: Period, integration: OverviewIntegration = overviewIntegration, rules: OverviewRules = overviewRules) {
  const base = getDashboardData(unit, period);
  const records = new Map(uniqueById(integration.records.filter(item => item.scope === period), item => item.initiativeId).map(item => [item.initiativeId, item]));
  const initiatives = uniqueById(base.initiatives, item => item.id).filter(item => !["inactive", "cancelled"].includes(records.get(item.id)?.lifecycle ?? "active"));
  const data = { ...base, initiatives, pipeline: base.pipeline.map(item => ({ ...item, count: initiatives.filter(initiative => initiative.stage === item.stage).length })), risks: initiatives.filter(item => item.atRisk), onBudget: initiatives.filter(item => item.executionStatus === "onBudget"), delayed: initiatives.filter(item => item.executionStatus === "delayed"), interrupted: initiatives.filter(item => item.executionStatus === "interrupted") };
  const health: InitiativeHealth[] = initiatives.map(initiative => {
    const record = records.get(initiative.id);
    return { initiative, ...classifyInitiative(record, rules, integration.referenceDate), updatedAt: parseReportingDate(record?.updatedAt) === null ? null : record!.updatedAt! };
  });
  return { data, health, maturity: aggregateMaturity(initiatives), alerts: executiveAlerts(health, records, integration.referenceDate, rules), capture: calculateCaptureAccumulated(integration.capture, unit, period) };
}
export type OverviewData = ReturnType<typeof getOverviewData>;
