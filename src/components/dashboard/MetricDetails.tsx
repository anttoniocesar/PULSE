import { executionStatusLabels, formatMoney, formatNumber, getMetricValue, metrics, type DashboardData, type MetricKey } from "../../data/demoData";
import { getOverviewData } from "../../utils/overviewCalculations";
import InitiativeList from "./InitiativeList";

export default function MetricDetails({ metricKey, data }: { metricKey: MetricKey; data: DashboardData }) {
  const metric = metrics.find(item => item.key === metricKey)!;
  const units = data.unit === "all" ? ["A", "B"] as const : [data.unit];
  return (
    <>
      <div className={`drawer-metric drawer-metric--${metricKey}`}><span>{metric.title}</span><strong>{getMetricValue(metricKey, data)}</strong><p>{metric.description}</p></div>
      <p className="drawer-context-note">{data.scopeLabel}. Realizado confirmado até setembro; forecast de fechamento em dezembro de 2026.</p>
      {metricKey === "capture" && <div className="drawer-formula">{formatMoney(data.realized)} ÷ {formatMoney(data.potential)} × 100 = <strong>{formatNumber(data.capture)}%</strong></div>}
      <section className="drawer-breakdown"><h3>Composição por unidade</h3><dl>{units.map(unit => {
        const unitData = getOverviewData(unit, data.period).data;
        return <div key={unit}><dt>Unidade {unit}</dt><dd>{getMetricValue(metricKey, unitData)}</dd></div>;
      })}</dl></section>
      {metricKey === "potential" && <section className="drawer-breakdown"><h3>Potencial por área</h3><dl>{data.areas.map(area => <div key={area.name}><dt>{area.name}</dt><dd>{formatMoney(area.value)}</dd></div>)}</dl></section>}
      {metricKey === "forecast" && <section className="drawer-breakdown"><h3>Perspectiva de fechamento</h3><dl><div><dt>Realizado até setembro</dt><dd>{formatMoney(data.realized)}</dd></div><div><dt>Captura adicional projetada</dt><dd>{formatMoney(data.forecast - data.realized)}</dd></div><div><dt>Planejado no ano</dt><dd>{formatMoney(data.planned)}</dd></div></dl></section>}
      {metricKey === "realized" && <section className="drawer-breakdown"><h3>Captura confirmada</h3><dl><div><dt>Índice de captura</dt><dd>{formatNumber(data.capture)}%</dd></div><div><dt>Potencial ainda não capturado</dt><dd>{formatMoney(data.potential - data.realized)}</dd></div></dl></section>}
      {metricKey === "initiatives" && <InitiativeList initiatives={data.initiatives} />}
      {(metricKey === "onBudget" || metricKey === "delayed" || metricKey === "interrupted") && <InitiativeList initiatives={data[metricKey].map(item => ({ ...item, status: executionStatusLabels[metricKey] }))} />}
      {metricKey === "risk" && <InitiativeList initiatives={data.risks} />}
    </>
  );
}
