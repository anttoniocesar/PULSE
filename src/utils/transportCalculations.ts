import { logisticsFinancialInputs, logisticsUnits, type LogisticsContext, type LogisticsFinancialInput } from "../data/logisticsTree";
import { transportFactorInputs, type TransportComponentId, type TransportFactorInput } from "../data/transportComposition";
import type { IndustrialUnit } from "../data/mathTreeTrefilarias";
import { calculateVariance } from "./mathTreeCalculations";

export type TransportCostId = "transport" | TransportComponentId;
export const isTransportCost = (id: string): id is TransportCostId => id === "transport" || id === "support-machines" || id === "coil-transport";

export function multiplyTransportFactors(quantity: number | null, unitPrice: number | null): number | null {
  if (quantity === null || unitPrice === null || !Number.isFinite(quantity) || !Number.isFinite(unitPrice) || quantity < 0 || unitPrice < 0) return null;
  const result = quantity * unitPrice;
  return Number.isFinite(result) ? result : null;
}
export function reconcileTransportCost(official: number | null, calculated: number | null) {
  const rawDifference = official === null || calculated === null ? null : calculated - official;
  const difference = rawDifference === null ? null : Math.abs(rawDifference) < 0.005 ? 0 : Math.round(rawDifference * 100) / 100;
  return { official, calculated, value: official ?? calculated, difference, pending: calculated === null || (difference !== null && difference !== 0) };
}
export function getTransportFactors(id: TransportComponentId, unit: IndustrialUnit, context: LogisticsContext, inputs: readonly TransportFactorInput[] = transportFactorInputs) {
  return inputs.find(row => row.componentId === id && row.unit === unit && row.scenario === context.scenario && row.period === context.period);
}
export function getTransportUnitCosts(id: TransportCostId, unit: IndustrialUnit, context: LogisticsContext, officialInputs: readonly LogisticsFinancialInput[] = logisticsFinancialInputs, factors: readonly TransportFactorInput[] = transportFactorInputs) {
  const official = officialInputs.find(row => row.componentId === id && row.unit === unit && row.scenario === context.scenario && row.period === context.period);
  function scenario(field: "budget" | "forecast"): ReturnType<typeof reconcileTransportCost> {
    if (id === "transport") {
      const children = (["support-machines", "coil-transport"] as const).map(child => getTransportUnitCosts(child, unit, context, officialInputs, factors)[field]);
      const sum = children.some(child => child.value === null) ? null : children.reduce((total, child) => total + child.value!, 0);
      const result = reconcileTransportCost(official?.[field].absolute ?? null, sum);
      return { ...result, pending: result.pending || children.some(child => child.pending) };
    }
    const input = getTransportFactors(id, unit, context, factors)?.[field];
    return reconcileTransportCost(official?.[field].absolute ?? null, multiplyTransportFactors(input?.quantity ?? null, input?.unitPrice ?? null));
  }
  return { budget: scenario("budget"), forecast: scenario("forecast") };
}
export function getTransportTotals(id: TransportCostId, context: LogisticsContext, officialInputs: readonly LogisticsFinancialInput[] = logisticsFinancialInputs, factors: readonly TransportFactorInput[] = transportFactorInputs) {
  const rows = logisticsUnits.filter(unit => context.unit === "all" || context.unit === unit.sourceCode).map(unit => getTransportUnitCosts(id, unit.sourceCode, context, officialInputs, factors));
  const sum = (field: "budget" | "forecast") => rows.length === 0 || rows.some(row => row[field].value === null) ? null : rows.reduce((total, row) => total + row[field].value!, 0);
  const budget = sum("budget"), forecast = sum("forecast");
  return { budget, forecast, ...calculateVariance(budget, forecast), pending: rows.some(row => row.budget.pending || row.forecast.pending) };
}
