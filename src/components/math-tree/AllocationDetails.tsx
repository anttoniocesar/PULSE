import { ChevronDown } from "lucide-react";
import { type LogisticsContext, type LogisticsNodeId } from "../../data/logisticsTree";
import { getLogisticsAllocations } from "../../utils/logisticsCalculations";
import { formatMathNumber } from "../../utils/mathTreeCalculations";

export default function AllocationDetails({ componentId, context, open, onOpenChange }: { componentId: LogisticsNodeId; context: LogisticsContext; open: boolean; onOpenChange: (open: boolean) => void }) {
  const entries = getLogisticsAllocations(componentId, context);
  return <details className="logistics-allocation nodrag nopan" open={open} onToggle={event => { if (event.currentTarget.open !== open) onOpenChange(event.currentTarget.open); }}>
    <summary><ChevronDown size={13} aria-hidden="true" />Detalhamento do Rateio</summary>
    <div className="logistics-allocation__body nowheel">
      {entries.length === 0 ? <><p>Centros de custo e regras ainda não fornecidos.</p><dl className="logistics-allocation__fields">{["Centro de custo", "Regra de rateio", "Percentual de rateio", "Unidade de origem", "Unidade de destino"].map(label => <div key={label}><dt>{label}</dt><dd>Não informado</dd></div>)}</dl></>
        : entries.map(entry => <dl className="logistics-allocation__fields" key={entry.id}><div><dt>Centro de custo</dt><dd>{entry.costCenter ?? "Não informado"}</dd></div><div><dt>Regra de rateio</dt><dd>{entry.rule ?? "Não informado"}</dd></div><div><dt>Percentual de rateio</dt><dd>{entry.percentage === null ? "Não informado" : `${formatMathNumber(entry.percentage, 2)}%`}</dd></div><div><dt>Unidade de origem</dt><dd>{entry.originUnit ?? "Não informado"}</dd></div><div><dt>Unidade de destino</dt><dd>{entry.destinationUnit ?? "Não informado"}</dd></div></dl>)}
    </div>
  </details>;
}
