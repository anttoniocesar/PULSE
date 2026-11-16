import { logisticsAllocations, logisticsFinancialInputs, logisticsHierarchy, type LogisticsAllocation, type LogisticsContext, type LogisticsFinancialInput, type LogisticsNodeId } from "../data/logisticsTree";
import { calculateVariance } from "./mathTreeCalculations";

export function getLogisticsRows(componentId: LogisticsNodeId, context: LogisticsContext, inputs: readonly LogisticsFinancialInput[] = logisticsFinancialInputs) {
  return inputs.filter(row => row.componentId === componentId && row.scenario === context.scenario &&
    (context.unit === "all" || row.unit === context.unit) && row.period === context.period);
}
export function getLogisticsTotals(componentId: LogisticsNodeId, context: LogisticsContext, inputs: readonly LogisticsFinancialInput[] = logisticsFinancialInputs) {
  const rows = getLogisticsRows(componentId, context, inputs);
  const sum = (field: "budget" | "forecast") => rows.length === 0 || rows.some(row => row[field].absolute === null)
    ? null : rows.reduce((total, row) => total + row[field].absolute!, 0);
  const budget = sum("budget"), forecast = sum("forecast");
  return { budget, forecast, ...calculateVariance(budget, forecast) };
}
export function getLogisticsAllocations(componentId: LogisticsNodeId, context: LogisticsContext, allocations: readonly LogisticsAllocation[] = logisticsAllocations) {
  return allocations.filter(row => row.componentId === componentId && row.scenario === context.scenario &&
    (context.unit === "all" || row.unit === context.unit) && row.period === context.period);
}

export function getLogisticsLayout(collapsed: ReadonlySet<LogisticsNodeId>, allocationOpen: ReadonlySet<LogisticsNodeId>, context: LogisticsContext, expandedBranches: ReadonlySet<LogisticsNodeId> = new Set()) {
  const positions = new Map<LogisticsNodeId, { x: number; y: number }>();
  const visible = new Set<LogisticsNodeId>();
  const height = (id: LogisticsNodeId) => {
    const terminal = id === "support-machines" || id === "coil-transport";
    const contentExpanded = terminal || !collapsed.has(id);
    const baseHeight = terminal ? (context.unit === "all" ? 384 : 260) : (context.unit === "all" ? 252 : 188) + (id === "transport" ? 28 : 0);
    return (contentExpanded ? baseHeight : 115) + (allocationOpen.has(id) && contentExpanded ? 130 : 0);
  };
  const children = (id: LogisticsNodeId) => id === "logistics" || expandedBranches.has(id) ? logisticsHierarchy.filter(item => item.parentId === id) : [];
  const subtreeHeight = (id: LogisticsNodeId): number => {
    const descendants = children(id);
    return Math.max(height(id), descendants.reduce((sum, child) => sum + subtreeHeight(child.id), 0) + Math.max(0, descendants.length - 1) * 24);
  };
  function place(id: LogisticsNodeId, depth: number, top: number) {
    visible.add(id);
    const totalHeight = subtreeHeight(id);
    positions.set(id, { x: 20 + depth * 515, y: top + (totalHeight - height(id)) / 2 });
    const descendants = children(id);
    const childrenHeight = descendants.reduce((sum, child) => sum + subtreeHeight(child.id), 0) + Math.max(0, descendants.length - 1) * 24;
    let nextY = top + (totalHeight - childrenHeight) / 2;
    for (const child of descendants) { place(child.id, depth + 1, nextY); nextY += subtreeHeight(child.id) + 24; }
  }
  place("logistics", 0, 20);
  return { positions, height, visible };
}
