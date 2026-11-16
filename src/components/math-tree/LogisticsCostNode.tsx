import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CalendarClock, ChevronDown, ChevronRight, Cog, Container, Layers3, PackageCheck, Truck, UsersRound } from "lucide-react";
import { logisticsGlossary, logisticsHierarchy, logisticsUnits, type LogisticsContext, type LogisticsNodeId } from "../../data/logisticsTree";
import { getLogisticsRows, getLogisticsTotals } from "../../utils/logisticsCalculations";
import { compareUnitCosts, formatMathNumber, formatSignedMoney, formatVariancePercent } from "../../utils/mathTreeCalculations";
import VarianceBadge from "./VarianceBadge";
import AllocationDetails from "./AllocationDetails";
import { getTransportTotals, getTransportUnitCosts, isTransportCost } from "../../utils/transportCalculations";
import { TransportCostContent } from "./TransportCompositionContent";

export type LogisticsFlowNode = Node<{
  id: LogisticsNodeId; context: LogisticsContext; expanded: boolean; detailsExpanded: boolean; allocationOpen: boolean;
  onToggle: (id: LogisticsNodeId) => void; onAllocation: (id: LogisticsNodeId, open: boolean) => void;
}, "logistics">;
const icons = { logistics: Layers3, transport: Truck, management: UsersRound, planning: CalendarClock, shipping: PackageCheck, "support-machines": Cog, "coil-transport": Container };

export default function LogisticsCostNode({ data }: NodeProps<LogisticsFlowNode>) {
  const component = logisticsHierarchy.find(item => item.id === data.id)!;
  const root = data.id === "logistics";
  const Icon = icons[data.id];
  const rows = getLogisticsRows(data.id, data.context);
  const transportTotals = isTransportCost(data.id) ? getTransportTotals(data.id, data.context) : null;
  const transportCost = transportTotals !== null;
  const totals = transportTotals ?? getLogisticsTotals(data.id, data.context);
  const product = data.id === "support-machines" || data.id === "coil-transport";
  const contentExpanded = product || data.detailsExpanded;
  const visibleUnits = logisticsUnits.filter(unit => data.context.unit === "all" || unit.sourceCode === data.context.unit);
  return <article className={`logistics-node${root ? " logistics-node--root" : ""}${transportCost ? " logistics-node--transport" : ""}${product ? " logistics-node--product" : ""}${contentExpanded ? "" : " logistics-node--collapsed"}${data.context.unit !== "all" ? " logistics-node--single" : ""}`}>
    {!root && <Handle type="target" position={Position.Left} isConnectable={false} />}
    {logisticsHierarchy.some(child => child.parentId === data.id) && <Handle type="source" position={Position.Right} isConnectable={false} />}
    <header className="logistics-node__heading"><span className="logistics-node__icon"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span><h2>{component.name}</h2>{!root && !product && <button className="logistics-node__toggle nodrag nopan" type="button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); data.onToggle(data.id); }} aria-label={`${data.expanded ? "Recolher" : "Expandir"} ${component.name}`} aria-expanded={data.expanded}>{data.expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>}</header>
    {contentExpanded ? <>
      {product && (data.id === "support-machines" || data.id === "coil-transport") ? <TransportCostContent id={data.id} context={data.context} /> : <>
      <table className="math-node-table logistics-node__table nodrag nopan" aria-label={`${component.name}: custos BDG e ${data.context.scenario}`}>
        <colgroup><col className="logistics-col-unit" /><col /><col className="logistics-col-rate" /><col /><col className="logistics-col-rate" /></colgroup>
        <thead><tr><th rowSpan={2} scope="col">Unid.</th><th colSpan={2} scope="colgroup"><abbr title={logisticsGlossary.BDG}>BDG</abbr></th><th colSpan={2} scope="colgroup"><abbr title={logisticsGlossary.MRF}>{data.context.scenario}</abbr></th></tr><tr><th scope="col">Absoluto (R$)</th><th scope="col"><abbr title={logisticsGlossary.unit}>R$/t</abbr></th><th scope="col">Absoluto (R$)</th><th scope="col"><abbr title={logisticsGlossary.unit}>R$/t</abbr></th></tr></thead>
        <tbody>{visibleUnits.map(unit => {
          const row = rows.find(item => item.unit === unit.sourceCode);
          const budget = row?.budget.referenceUnitCost ?? null, forecast = row?.forecast.referenceUnitCost ?? null;
          const comparison = compareUnitCosts(budget, forecast);
          const transportValues = data.id === "transport" ? getTransportUnitCosts(data.id, unit.sourceCode, data.context) : null;
          return <tr key={unit.sourceCode}><th scope="row" title={`${unit.name}${unit.pendingRegistration ? " — cadastro a validar" : ""}`}>{unit.code}</th><td>{formatMathNumber(transportValues ? transportValues.budget.value : row?.budget.absolute ?? null)}</td><td className={`math-unit-cost--${comparison.budget}`}>{formatMathNumber(budget, row?.budget.unitDecimals ?? 2)}</td><td>{formatMathNumber(transportValues ? transportValues.forecast.value : row?.forecast.absolute ?? null)}</td><td className={`math-unit-cost--${comparison.forecast}`}>{formatMathNumber(forecast, row?.forecast.unitDecimals ?? 2)}</td></tr>;
        })}</tbody>
      </table>
      </>}
      <div className="logistics-node__variance"><span>Variação</span><strong>{formatSignedMoney(totals.absolute)}</strong>{totals.absolute === null ? <span className="logistics-node__missing">Sem base informada</span> : <VarianceBadge variance={totals} />}</div>
      {transportTotals?.pending && <p className="transport-reconciliation-note">Detalhamento pendente de conciliação. Valor oficial preservado quando informado.</p>}
      <AllocationDetails componentId={data.id} context={data.context} open={data.allocationOpen} onOpenChange={open => data.onAllocation(data.id, open)} />
    </> : <p className="logistics-node__collapsed-note">{visibleUnits.length} {visibleUnits.length === 1 ? "unidade" : "unidades"} · detalhes recolhidos <span>{formatVariancePercent(totals.percent)}</span></p>}
  </article>;
}
