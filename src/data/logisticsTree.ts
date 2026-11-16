import { costComponents, type CostInput, type IndustrialUnit, type MathTreeUnit } from "./mathTreeTrefilarias";
import { transportHierarchy } from "./transportComposition";

export const logisticsHierarchy = [
  { id: "logistics", parentId: null, name: "Custos Administrativos | Logística", kind: "cost" },
  { id: "transport", parentId: "logistics", name: "Transporte Interno", kind: "cost" },
  { id: "management", parentId: "logistics", name: "Gerência Trefilaria", kind: "cost" },
  { id: "planning", parentId: "logistics", name: "Planejamento e Programação", kind: "cost" },
  { id: "shipping", parentId: "logistics", name: "Expedição de Trefilados", kind: "cost" },
  ...transportHierarchy,
] as const;
export type LogisticsNodeId = (typeof logisticsHierarchy)[number]["id"];

export const logisticsUnits: { sourceCode: IndustrialUnit; code: string; name: string; pendingRegistration: boolean }[] = [
  { sourceCode: "JF", code: "JF", name: "Juiz de Fora", pendingRegistration: false },
  { sourceCode: "SP", code: "SP", name: "São Paulo", pendingRegistration: true },
  { sourceCode: "Sa", code: "SB", name: "Sabará", pendingRegistration: false },
  { sourceCode: "Re", code: "Re", name: "Resende", pendingRegistration: true },
];

export type LogisticsContext = { unit: MathTreeUnit; scenario: "MRF04"; period: string | null };
export type LogisticsFinancialInput = {
  componentId: LogisticsNodeId;
  unit: IndustrialUnit;
  scenario: "MRF04";
  // The source did not supply a reporting period. Do not label these figures as a known year/month.
  period: string | null;
  budget: CostInput;
  forecast: CostInput;
  provenance: "parent-reference" | "not-provided";
};

const missingCost = (): CostInput => ({ absolute: null, referenceUnitCost: null, unitDecimals: 2 });
export const logisticsFinancialInputs: LogisticsFinancialInput[] = logisticsHierarchy.filter(component => component.kind === "cost").flatMap(component =>
  logisticsUnits.map(unit => {
    const existing = component.id === "logistics" ? costComponents.find(item => item.id === "administration")!.rows.find(row => row.unit === unit.sourceCode)! : null;
    return {
      componentId: component.id, unit: unit.sourceCode, scenario: "MRF04", period: null,
      budget: existing ? { ...existing.budget } : missingCost(),
      forecast: existing ? { ...existing.forecast } : missingCost(),
      provenance: existing ? "parent-reference" : "not-provided",
    };
  }),
);

export type LogisticsAllocation = {
  id: string;
  componentId: LogisticsNodeId;
  unit: IndustrialUnit;
  scenario: "MRF04";
  period: string | null;
  costCenter: string | null;
  rule: string | null;
  percentage: number | null;
  originUnit: string | null;
  destinationUnit: string | null;
};
// No cost-center codes, transfer bases or percentages were supplied. Multiple records per component/unit are supported.
export const logisticsAllocations: LogisticsAllocation[] = [];

export function normalizeMathUnit(value: string | null): MathTreeUnit {
  if (value === "SB") return "Sa";
  return value === "JF" || value === "SP" || value === "Sa" || value === "Re" ? value : "all";
}
export function logisticsUnitLabel(unit: MathTreeUnit) {
  if (unit === "all") return "Todas as unidades";
  const entry = logisticsUnits.find(item => item.sourceCode === unit)!;
  return `${entry.code} — ${entry.name}`;
}

export const logisticsGlossary = {
  BDG: "Budget: orçamento de referência para comparação dos custos.",
  MRF: "Forecast: previsão de custos do cenário selecionado; nesta base, MRF04.",
  unit: "R$/t: custo em reais por tonelada. Os valores informados são preservados; a base de rateio deve ser validada.",
};
