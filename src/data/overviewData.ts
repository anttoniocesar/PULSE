import type { Period, Stage } from "./demoData";

export type HealthLevel = "onTrack" | "attention" | "critical";
export type HealthDimension = "schedule" | "financial" | "risk";
export const healthLabels: Record<HealthLevel, string> = { onTrack: "On Track", attention: "Atenção", critical: "Crítico" };
export const dimensionLabels: Record<HealthDimension, string> = { schedule: "Prazo", financial: "Resultado financeiro", risk: "Risco" };
export const maturityDefinitions: Record<Stage, { label: string; description: string }> = {
  L0: { label: "Ideia", description: "Oportunidade de transformação em estágio de ideia." },
  L1: { label: "Identificada", description: "Iniciativa identificada e registrada na carteira." },
  L2: { label: "Validada", description: "Premissas e potencial de valor validados." },
  L3: { label: "Planejada", description: "Execução planejada, com ações e responsáveis definidos." },
  L4: { label: "Implementada", description: "Mudança implementada e resultado em acompanhamento." },
  L5: { label: "Estabilizada", description: "Resultado estabilizado e sustentação acompanhada." },
};
export type Thresholds = { attention: number; critical: number };
export type OverviewRules = {
  scheduleDelayDays: Thresholds | null;
  financialShortfallPercent: Thresholds | null;
  riskScore: Thresholds | null;
  staleAfterDays: number | null;
};
// No corporate thresholds or seven-day update rule have been approved/provided.
export const overviewRules: OverviewRules = { scheduleDelayDays: null, financialShortfallPercent: null, riskScore: null, staleAfterDays: null };
export type ExecutiveRecord = {
  initiativeId: string;
  scope: Period;
  lifecycle?: "active" | "inactive" | "cancelled";
  updatedAt?: string | null; // Reporting dates use YYYY-MM-DD; normalize source timestamps before integration.
  assessments?: Partial<Record<HealthDimension, { level: HealthLevel; reason?: string }>>;
  schedule?: { dueDate: string | null; completedAt: string | null };
  financial?: { expected: number | null; actual: number | null };
  riskScore?: number | null;
  milestones?: { id: string; name: string; dueDate: string | null; status: "pending" | "completed" | "cancelled"; owner?: string | null }[];
  decisions?: { id: string; description: string; status: "pending" | "resolved" | "cancelled"; dueDate?: string | null; owner?: string | null; action?: string | null }[];
};
export type CaptureRecord = {
  id: string;
  unit: "A" | "B";
  scope: Period;
  month: string; // YYYY-MM; supplied cumulative closing values in R$ millions, never interpolated.
  plannedCumulative: number | null;
  actualCumulative: number | null;
  forecastCumulative: number | null;
};
export type OverviewIntegration = {
  referenceDate: string | null; // Reporting date from the source, not the browser clock.
  records: readonly ExecutiveRecord[];
  capture: readonly CaptureRecord[];
};
// Integration seam only. The existing demo records remain the sole portfolio source.
// No operational milestones, decisions, assessments, timestamps or monthly closings supplied.
export const overviewIntegration: OverviewIntegration = { referenceDate: null, records: [], capture: [] };
