import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Building2, CircleAlert, GitFork, Layers3, Settings, Truck } from "lucide-react";
import { costComponents, type CostComponent, type CostNodeId, type MathTreeUnit } from "../../data/mathTreeTrefilarias";
import { compareUnitCosts, componentTotals, formatMathNumber, reconciliationIssues, selectedRows, unitCostDiagnostic } from "../../utils/mathTreeCalculations";
import VarianceBadge from "./VarianceBadge";

export type CostFlowNode = Node<{
  component: CostComponent; unit: MathTreeUnit; expanded: boolean;
  onToggle: (id: CostNodeId) => void; onDetails: (id: CostNodeId) => void;
}, "cost">;
const icons = { total: Layers3, direct: Layers3, indirect: Layers3, administration: Truck, operating: Settings, gendt: GitFork, corporate: Building2, allocations: GitFork };

export default function CostNode({ data }: NodeProps<CostFlowNode>) {
  const { component, unit, onDetails } = data;
  const rows = selectedRows(component, unit);
  const hasChildren = costComponents.some(item => item.parentId === component.id);
  const Icon = icons[component.id];
  const needsValidation = reconciliationIssues(component, unit).length > 0 || rows.some(row => unitCostDiagnostic(row, "budget").differs || unitCostDiagnostic(row, "forecast").differs);
  return (
    <article className={`math-cost-node${component.id === "total" ? " math-cost-node--root" : ""}${component.id === "administration" ? " math-cost-node--drilldown nopan" : ""}`} onClick={component.id === "administration" ? () => onDetails(component.id) : undefined}>
      <Handle type="target" position={Position.Left} id="parent" isConnectable={false} />
      {component.id === "total" && <Handle type="target" position={Position.Top} id="production" isConnectable={false} />}
      <header className="math-node-header">
        <Icon className="math-node-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
        <button className="math-node-title nodrag nopan" type="button" onClick={event => { event.stopPropagation(); onDetails(component.id); }} title={`${component.id === "administration" ? "Abrir composição" : "Ver detalhes"}: ${component.name}`}>{component.name}</button>
        <VarianceBadge variance={componentTotals(component, unit)} />
      </header>
      <table className="math-node-table nodrag" aria-label={`${component.name} — BDG e MRF04; valores absolutos em reais e unitários em R$/t`}>
        <colgroup><col className="math-col-unit" /><col /><col className="math-col-rate" /><col /><col className="math-col-rate" /></colgroup>
        <thead><tr><th rowSpan={2} scope="col">Unid.</th><th colSpan={2} scope="colgroup">BDG</th><th colSpan={2} scope="colgroup">MRF04</th></tr><tr><th scope="col">Absoluto (R$)</th><th scope="col">R$/t</th><th scope="col">Absoluto (R$)</th><th scope="col">R$/t</th></tr></thead>
        <tbody>{rows.map(row => {
          const comparison = compareUnitCosts(row.budget.referenceUnitCost, row.forecast.referenceUnitCost);
          return <tr key={row.unit}><th scope="row">{row.unit}</th><td>{formatMathNumber(row.budget.absolute)}</td><td className={`math-unit-cost--${comparison.budget}${unitCostDiagnostic(row, "budget").differs ? " math-value-review" : ""}`} title={unitCostDiagnostic(row, "budget").differs ? "Valor informado difere da razão indicativa custo / produção. Validar base de alocação nos detalhes." : undefined}>{formatMathNumber(row.budget.referenceUnitCost, row.budget.unitDecimals)}</td><td>{formatMathNumber(row.forecast.absolute)}</td><td className={`math-unit-cost--${comparison.forecast}${unitCostDiagnostic(row, "forecast").differs ? " math-value-review" : ""}`}>{formatMathNumber(row.forecast.referenceUnitCost, row.forecast.unitDecimals)}</td></tr>;
        })}</tbody>
      </table>
      {needsValidation && <span className="math-node-validation" title="Há valores ou relações de alocação a validar. Abra os detalhes." aria-label="Dados a validar"><CircleAlert size={12} /></span>}
      {hasChildren && <Handle type="source" position={Position.Right} id="children" isConnectable={false} />}
    </article>
  );
}
