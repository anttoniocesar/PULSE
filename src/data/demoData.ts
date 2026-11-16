export type Unit = "all" | "A" | "B";
export type Period = "YTD" | "FY";
export type Stage = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type InitiativeExecutionStatus = "onBudget" | "delayed" | "interrupted";
export type MetricKey = "potential" | "realized" | "forecast" | "initiatives" | "capture" | "risk" | InitiativeExecutionStatus;
export const executionStatusLabels: Record<InitiativeExecutionStatus, string> = {
  onBudget: "Dentro do planejado", delayed: "Atrasada", interrupted: "Interrompida",
};

export const stages: Stage[] = ["L0", "L1", "L2", "L3", "L4", "L5"];
export const unitOptions: { value: Unit; label: string }[] = [
  { value: "all", label: "Todas as unidades" },
  { value: "A", label: "Unidade A" },
  { value: "B", label: "Unidade B" },
];
export const periodOptions: { value: Period; label: string }[] = [
  { value: "YTD", label: "YTD 2026" },
  { value: "FY", label: "FY 2026" },
];
export const stageDescriptions: Record<Stage, string> = {
  L0: "Identificação", L1: "Qualificação", L2: "Validação",
  L3: "Implementação", L4: "Captura", L5: "Sustentação",
};

export const metrics: { key: MetricKey; title: string; caption: string; description: string }[] = [
  { key: "potential", title: "Potencial Validado", caption: "Benefícios esperados da carteira", description: "Soma dos benefícios esperados das iniciativas validadas, distribuídos entre as áreas da unidade selecionada." },
  { key: "realized", title: "Valor Realizado", caption: "Captura confirmada até setembro", description: "Benefício efetivamente capturado e confirmado até setembro de 2026. Valores futuros não são contabilizados como realizado." },
  { key: "forecast", title: "Forecast", caption: "Projeção de fechamento de 2026", description: "Previsão de captura de valor no encerramento do ano para a carteira selecionada. É uma projeção, não um resultado realizado." },
  { key: "initiatives", title: "Total Iniciativas", caption: "Carteira distribuída de L0 a L5", description: "Quantidade de registros demonstrativos da carteira selecionada. Cada registro pode ser consultado por estágio e unidade." },
  { key: "onBudget", title: "Iniciativas on Budget", caption: "Iniciativas dentro do planejado", description: "Iniciativas classificadas dentro do planejado na carteira selecionada, sem atraso ou interrupção registrada." },
  { key: "delayed", title: "Iniciativas atrasadas", caption: "Demandam acompanhamento de prazo", description: "Iniciativas com atraso no planejamento de execução, que demandam acompanhamento de prazo." },
  { key: "interrupted", title: "Iniciativas interrompidas", caption: "Exigem avaliação gerencial", description: "Iniciativas com execução interrompida, que exigem avaliação gerencial para retomada ou revisão." },
];

const areaNames = ["Produção", "Manutenção", "Energia", "Logística", "Outros"];
const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const snapshots = {
  A: {
    YTD: { areas: [8.6, 5.4, 4.2, 2.7, 1.5], realized: 15.8, forecast: 20.1, planned: 21.4 },
    FY: { areas: [10, 6.2, 4.9, 3.1, 1.8], realized: 15.8, forecast: 23.5, planned: 24.7 },
  },
  B: {
    YTD: { areas: [9.9, 5.8, 5.2, 3.1, 1.8], realized: 15.7, forecast: 23.6, planned: 25 },
    FY: { areas: [11.5, 6.8, 6, 3.6, 2.1], realized: 15.7, forecast: 27.3, planned: 28.6 },
  },
};

export type Initiative = {
  id: string;
  name: string;
  unit: "A" | "B";
  owner: string;
  stage: Stage;
  area: string;
  annualOnly: boolean;
  atRisk: boolean;
  reason: string;
  status: string;
  executionStatus: InitiativeExecutionStatus;
};

const initiativeNames = [
  ["Otimização do ciclo de produção", "Redução de perdas de processo", "Aumento da produtividade"],
  ["Revisão da manutenção preventiva", "Confiabilidade dos ativos", "Redução de paradas não programadas"],
  ["Eficiência do consumo elétrico", "Recuperação de energia", "Otimização da demanda energética"],
  ["Otimização das rotas internas", "Redução do tempo de transporte", "Revisão do fluxo de materiais"],
  ["Padronização de processos", "Redução de custos indiretos", "Melhoria do ciclo de planejamento"],
];
const riskReasons = [
  "Prazo de validação ultrapassado.",
  "Bloqueio na alocação de recursos.",
  "Premissas de benefício aguardam revisão.",
  "Dependência entre áreas ainda não resolvida.",
  "Evidência de captura pendente de confirmação.",
];
const initialStages = { A: [8, 10, 13, 12, 9, 6], B: [10, 11, 16, 14, 10, 7] };
const additionalStages = { A: [3, 2, 1, 1, 1, 0], B: [3, 2, 2, 1, 1, 1] };
const riskIndices = { A: [3, 8, 15, 23, 33, 45], B: [4, 12, 19, 27, 35, 44, 53, 62] };
// Exclusive execution classifications; risk remains an independent, unchanged dimension.
const executionCounts = {
  A: { YTD: { onBudget: 44, delayed: 9 }, additional: { onBudget: 6, delayed: 1 } },
  B: { YTD: { onBudget: 50, delayed: 12 }, additional: { onBudget: 7, delayed: 2 } },
};

function generateInitiatives(unit: "A" | "B", annualOnly: boolean): Initiative[] {
  const distribution = annualOnly ? additionalStages[unit] : initialStages[unit];
  let index = 0;
  return stages.flatMap((stage, stageIndex) =>
    Array.from({ length: distribution[stageIndex] }, () => {
      const recordIndex = index++;
      const areaIndex = recordIndex % areaNames.length;
      const number = recordIndex + 1 + (annualOnly ? initialStages[unit].reduce((a, b) => a + b, 0) : 0);
      const id = `${unit}-${String(number).padStart(3, "0")}`;
      const atRisk = annualOnly ? recordIndex < 2 : riskIndices[unit].includes(recordIndex);
      const counts = executionCounts[unit][annualOnly ? "additional" : "YTD"];
      const executionStatus: InitiativeExecutionStatus = recordIndex < counts.onBudget ? "onBudget"
        : recordIndex < counts.onBudget + counts.delayed ? "delayed" : "interrupted";
      return {
        id, unit, stage, annualOnly, atRisk, executionStatus,
        name: `${initiativeNames[areaIndex][Math.floor(recordIndex / 5) % 3]} · ${id}`,
        owner: `Responsável Demo ${unit}-${String(recordIndex % 8 + 1).padStart(2, "0")}`,
        area: areaNames[areaIndex],
        reason: atRisk ? riskReasons[recordIndex % riskReasons.length] : "Sem pendências críticas registradas.",
        status: atRisk ? "Em risco" : annualOnly ? "Planejada para o 4º trimestre" : stage === "L5" ? "Em sustentação" : "Em andamento",
      };
    }),
  );
}

export const demoInitiatives: Initiative[] = (["A", "B"] as const).flatMap(unit => [
  ...generateInitiatives(unit, false), ...generateInitiatives(unit, true),
]);
const round = (value: number) => Math.round(value * 100) / 100;
export const formatNumber = (value: number, decimals = 1) => value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
export const formatMoney = (value: number) => `R$ ${formatNumber(value)} mi`;

export function getDashboardData(unit: Unit = "all", period: Period = "YTD") {
  const selectedUnits = unit === "all" ? ["A", "B"] as const : [unit];
  const selected = selectedUnits.map(key => snapshots[key][period]);
  const initiatives = demoInitiatives.filter(item =>
    (unit === "all" || item.unit === unit) && (period === "FY" || !item.annualOnly),
  );
  const areas = areaNames.map((name, index) => ({ name, value: round(selected.reduce((sum, snapshot) => sum + snapshot.areas[index], 0)) }));
  const potential = round(areas.reduce((sum, area) => sum + area.value, 0));
  const realized = round(selected.reduce((sum, snapshot) => sum + snapshot.realized, 0));
  const forecast = round(selected.reduce((sum, snapshot) => sum + snapshot.forecast, 0));
  const planned = round(selected.reduce((sum, snapshot) => sum + snapshot.planned, 0));
  const risks = initiatives.filter(item => item.atRisk);
  const onBudget = initiatives.filter(item => item.executionStatus === "onBudget");
  const delayed = initiatives.filter(item => item.executionStatus === "delayed");
  const interrupted = initiatives.filter(item => item.executionStatus === "interrupted");
  const pipeline = stages.map(stage => ({ stage, label: stageDescriptions[stage], count: initiatives.filter(item => item.stage === stage).length }));
  const actualFractions = [0.055, 0.13, 0.22, 0.33, 0.44, 0.57, 0.7, 0.85, 1];
  const planFractions = [0.05, 0.12, 0.2, 0.28, 0.36, 0.45, 0.54, 0.63, 0.73, 0.82, 0.91, 1];
  const trend = months.map((month, index) => ({
    month,
    planned: round(selected.reduce((sum, snapshot) => sum + round(snapshot.planned * planFractions[index]), 0)),
    realized: index <= 8 ? round(selected.reduce((sum, snapshot) => sum + round(snapshot.realized * actualFractions[index]), 0)) : null,
    forecast: index >= 8 ? round(selected.reduce((sum, snapshot) => sum + round(snapshot.realized + (snapshot.forecast - snapshot.realized) * (index - 8) / 3), 0)) : null,
  }));
  return {
    unit, period, potential, realized, forecast, planned, initiatives, risks, pipeline, areas, trend,
    onBudget, delayed, interrupted,
    capture: realized / potential * 100,
    unitLabel: unitOptions.find(option => option.value === unit)!.label,
    periodLabel: periodOptions.find(option => option.value === period)!.label,
    scopeLabel: period === "YTD" ? "Carteira até setembro" : "Carteira anual, incluindo o 4º trimestre",
  };
}

export type DashboardData = ReturnType<typeof getDashboardData>;

export function getMetricValue(key: MetricKey, data: DashboardData): string {
  if (key === "initiatives") return String(data.initiatives.length);
  if (key === "risk") return String(data.risks.length);
  if (key === "capture") return `${formatNumber(data.capture)}%`;
  if (key === "onBudget" || key === "delayed" || key === "interrupted") return String(data[key].length);
  return formatMoney(data[key]);
}
