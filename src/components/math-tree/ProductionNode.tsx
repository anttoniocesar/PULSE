import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { productionInputs, type MathTreeUnit } from "../../data/mathTreeTrefilarias";
import { formatMathNumber, productionTotals } from "../../utils/mathTreeCalculations";
import VarianceBadge from "./VarianceBadge";

export type ProductionFlowNode = Node<{ unit: MathTreeUnit; onDetails: () => void }, "production">;
export default function ProductionNode({ data }: NodeProps<ProductionFlowNode>) {
  const rows = productionInputs.filter(row => data.unit === "all" || row.unit === data.unit);
  return (
    <article className="math-cost-node math-production-node">
      <header className="math-node-header"><ChartNoAxesColumnIncreasing className="math-node-icon" size={17} aria-hidden="true" /><button className="math-node-title nodrag nopan" onClick={data.onDetails} type="button">Produção (t)</button><VarianceBadge variance={productionTotals(data.unit)} production /></header>
      <table className="math-node-table nodrag" aria-label="Produção BDG e MRF04 em toneladas"><thead><tr><th scope="col">Unid.</th><th scope="col">BDG (t)</th><th scope="col">MRF04 (t)</th></tr></thead><tbody>{rows.map(row => <tr key={row.unit}><th scope="row">{row.unit}</th><td>{formatMathNumber(row.budget)}</td><td>{formatMathNumber(row.forecast)}</td></tr>)}</tbody></table>
      <Handle type="source" position={Position.Bottom} id="production" isConnectable={false} />
    </article>
  );
}
