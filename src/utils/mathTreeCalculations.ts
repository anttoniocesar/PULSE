import { costComponents, productionInputs, type CostComponent, type CostNodeId, type CostRow, type MathNodeId, type MathTreeUnit } from "../data/mathTreeTrefilarias";

export const formatMathNumber = (value: number | null, decimals = 0) => value === null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
export const formatMathMoney = (value: number | null) => value === null ? "Não informado" : `R$ ${formatMathNumber(value)}`;
export const formatSignedMoney = (value: number | null) => value === null ? "—" : `${value > 0 ? "+" : value < 0 ? "−" : ""}R$ ${formatMathNumber(Math.abs(value))}`;
export const formatVariancePercent = (value: number | null) => value === null ? "n/d" : `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatMathNumber(Math.abs(value), 1)}%`;

export function compareUnitCosts(budget: number | null, forecast: number | null): { budget: "lower" | "higher" | "neutral"; forecast: "lower" | "higher" | "neutral" } {
  if (budget === null || forecast === null || !Number.isFinite(budget) || !Number.isFinite(forecast) || budget === forecast) {
    return { budget: "neutral", forecast: "neutral" };
  }
  return budget < forecast ? { budget: "lower", forecast: "higher" } : { budget: "higher", forecast: "lower" };
}

export function calculateVariance(budget: number | null, forecast: number | null) {
  const absolute = budget === null || forecast === null ? null : forecast - budget;
  const percent = budget === null || forecast === null || budget === 0 ? null : (forecast / budget - 1) * 100;
  return { absolute, percent, favorable: absolute === null || absolute === 0 ? "neutral" as const : absolute < 0 ? "favorable" as const : "unfavorable" as const };
}

function sumComplete(values: (number | null)[]): number | null {
  return values.length === 0 || values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + value!, 0);
}
export function selectedRows(component: CostComponent, unit: MathTreeUnit) {
  return component.rows.filter(row => unit === "all" || row.unit === unit);
}
export function componentTotals(component: CostComponent, unit: MathTreeUnit) {
  const rows = selectedRows(component, unit);
  const budget = sumComplete(rows.map(row => row.budget.absolute));
  const forecast = sumComplete(rows.map(row => row.forecast.absolute));
  return { budget, forecast, ...calculateVariance(budget, forecast) };
}
export function productionTotals(unit: MathTreeUnit) {
  const rows = productionInputs.filter(row => unit === "all" || row.unit === unit);
  const budget = sumComplete(rows.map(row => row.budget));
  const forecast = sumComplete(rows.map(row => row.forecast));
  return { budget, forecast, ...calculateVariance(budget, forecast) };
}

export function unitCostDiagnostic(row: CostRow, scenario: "budget" | "forecast") {
  const production = productionInputs.find(item => item.unit === row.unit)?.[scenario] ?? null;
  const input = row[scenario];
  const indicative = input.absolute === null || production === null || production <= 0 ? null : input.absolute / production;
  const tolerance = 0.5 * 10 ** -input.unitDecimals + 1e-8;
  return {
    reference: input.referenceUnitCost, indicative,
    differs: indicative !== null && input.referenceUnitCost !== null && Math.abs(indicative - input.referenceUnitCost) > tolerance,
  };
}

export function reconciliationIssues(component: CostComponent, unit: MathTreeUnit) {
  const children = costComponents.filter(item => item.parentId === component.id);
  if (!children.length) return [];
  return selectedRows(component, unit).flatMap(row => (["budget", "forecast"] as const).flatMap(scenario => {
    const childrenTotal = sumComplete(children.map(child => child.rows.find(item => item.unit === row.unit)?.[scenario].absolute ?? null));
    const parentValue = row[scenario].absolute;
    const difference = childrenTotal === null || parentValue === null ? null : childrenTotal - parentValue;
    return difference === null || difference === 0 ? [] : [{ unit: row.unit, scenario, difference }];
  }));
}

export function largestVariances(unit: MathTreeUnit) {
  // Rank leaves only: adding parent and child variances would double count costs.
  return costComponents.filter(component => !costComponents.some(child => child.parentId === component.id))
    .map(component => ({ component, ...componentTotals(component, unit) }))
    .filter(item => item.absolute !== null)
    .sort((a, b) => Math.abs(b.absolute!) - Math.abs(a.absolute!));
}

export function buildTreeLayout(collapsed: ReadonlySet<CostNodeId>, unit: MathTreeUnit) {
  const nodeHeight = unit === "all" ? 156 : 102;
  const gap = 18;
  const positions = new Map<MathNodeId, { x: number; y: number }>();
  const visible = new Set<CostNodeId>();
  let nextY = 18;
  function place(id: CostNodeId, depth: number): number {
    visible.add(id);
    const children = collapsed.has(id) ? [] : costComponents.filter(item => item.parentId === id);
    let y: number;
    if (children.length) {
      const childPositions = children.map(child => place(child.id, depth + 1));
      y = (childPositions[0] + childPositions[childPositions.length - 1]) / 2;
    } else {
      y = nextY;
      nextY += nodeHeight + gap;
    }
    positions.set(id, { x: 20 + depth * 398, y });
    return y;
  }
  place("total", 0);
  const root = positions.get("total")!;
  positions.set("production", { x: root.x, y: root.y - nodeHeight - 55 });
  const minY = Math.min(...[...positions.values()].map(position => position.y));
  if (minY < 18) positions.forEach(position => { position.y += 18 - minY; });
  return { positions, visible, nodeHeight };
}
