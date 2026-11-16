import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import KPICard from "../components/dashboard/KPICard";
import ValueCaptureChart from "../components/dashboard/ValueCaptureChart";
import ValueByAreaChart from "../components/dashboard/ValueByAreaChart";
import InitiativePipeline from "../components/dashboard/InitiativePipeline";
import ManagementAttention from "../components/dashboard/ManagementAttention";
import DetailDrawer from "../components/dashboard/DetailDrawer";
import InitiativeList from "../components/dashboard/InitiativeList";
import MetricDetails from "../components/dashboard/MetricDetails";
import { metrics, type MetricKey, type Period, type Stage, type Unit } from "../data/demoData";
import { healthLabels, maturityDefinitions, type HealthLevel } from "../data/overviewData";
import { getOverviewData, type AlertKind } from "../utils/overviewCalculations";
import PortfolioHealth, { HealthDetails } from "../components/dashboard/PortfolioHealth";
import LeadershipAttention, { AlertDetails, alertLabels } from "../components/dashboard/LeadershipAttention";
import StrategicAlignment from "../components/dashboard/StrategicAlignment";
import "../styles/overview.css";

type Selection = { kind: "metric"; key: MetricKey } | { kind: "stage"; stage: Stage } | { kind: "risk" } | { kind: "health"; level: HealthLevel | "unassessed" } | { kind: "alert"; category: AlertKind };

export default function HomePage() {
  const [unit, setUnit] = useState<Unit>("all");
  const [period, setPeriod] = useState<Period>("YTD");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const { hash } = useLocation();
  const overview = useMemo(() => getOverviewData(unit, period), [unit, period]);
  const { data } = overview;
  useEffect(() => {
    if (hash === "#management-attention") document.getElementById("management-attention")?.scrollIntoView({ block: "center" });
  }, [hash]);
  const drawerTitle = selection?.kind === "metric" ? metrics.find(item => item.key === selection.key)!.title
    : selection?.kind === "stage" ? `${selection.stage} · ${maturityDefinitions[selection.stage].label}`
    : selection?.kind === "health" ? (selection.level === "unassessed" ? "Cobertura da avaliação" : `Saúde · ${healthLabels[selection.level]}`)
    : selection?.kind === "alert" ? alertLabels[selection.category] : "Iniciativas em risco";
  return (
    <div className="executive-overview">
      <div className="dashboard-page-heading"><div><p className="dashboard-eyebrow">VISÃO EXECUTIVA</p><h1>Executive Overview</h1><p>Performance, transformation and value capture.</p></div><span className="dashboard-overview-mark"><Activity size={23} strokeWidth={1.5} aria-hidden="true" /></span></div>
      <DashboardFilters unit={unit} period={period} onUnitChange={setUnit} onPeriodChange={setPeriod} />
      <p className="dashboard-scope" role="status">{data.unitLabel}<span> / </span>{data.periodLabel}<span> · </span>{data.scopeLabel}</p>
      <section className="overview-value" aria-labelledby="value-section-title">
        <div className="overview-section-heading"><h2 id="value-section-title">Captura de Valor</h2><p>Indicadores existentes · base demonstrativa · R$ milhões</p></div>
        <div className="dashboard-kpi-section" aria-labelledby="captures-kpi-title">
          <h3 id="captures-kpi-title">Capturas</h3>
          <div className="dashboard-kpis">{metrics.slice(0, 3).map(metric => <KPICard key={metric.key} metric={metric} data={data} onClick={() => setSelection({ kind: "metric", key: metric.key })} />)}</div>
        </div>
        <div className="dashboard-kpi-section" aria-labelledby="initiatives-kpi-title">
          <h3 id="initiatives-kpi-title">Iniciativas</h3>
          <div className="dashboard-kpis dashboard-kpis--initiatives">{metrics.slice(3).map(metric => <KPICard key={metric.key} metric={metric} data={data} onClick={() => setSelection({ kind: "metric", key: metric.key })} />)}</div>
        </div>
        <details className="overview-area" onToggle={event => setAreaOpen(event.currentTarget.open)}><summary>Consultar distribuição do potencial por área</summary>{areaOpen && <ValueByAreaChart data={data} />}</details>
      </section>
      <PortfolioHealth health={overview.health} onSelect={level => setSelection({ kind: "health", level })} />
      <InitiativePipeline maturity={overview.maturity} total={data.initiatives.length} onSelect={stage => setSelection({ kind: "stage", stage })} />
      <StrategicAlignment unit={unit} period={period} />
      <ValueCaptureChart data={data} capture={overview.capture} />
      <section className="overview-leadership" aria-labelledby="leadership-title">
        <div className="overview-section-heading"><h2 id="leadership-title">Pontos de Atenção da Liderança</h2><p>Ocorrências verificáveis e necessidades de decisão · cobertura indicada em cada categoria</p></div>
        <LeadershipAttention groups={overview.alerts} onSelect={category => setSelection({ kind: "alert", category })} />
        <ManagementAttention data={data} onClick={() => setSelection({ kind: "risk" })} />
      </section>
      <footer className="dashboard-footer"><span>PULSE · Performance &amp; Transformation</span><span>Concept Preview · 2026</span></footer>
      {selection && <DetailDrawer title={drawerTitle} context={`${data.unitLabel} · ${data.periodLabel}`} onClose={() => setSelection(null)}>
        {selection.kind === "metric" && <MetricDetails metricKey={selection.key} data={data} />}
        {selection.kind === "stage" && <><p className="drawer-context-note">{maturityDefinitions[selection.stage].description} {data.scopeLabel}.</p><InitiativeList initiatives={data.initiatives.filter(item => item.stage === selection.stage)} /></>}
        {selection.kind === "risk" && <><p className="drawer-context-note">Avaliar prazos, bloqueios e impacto no forecast. Responsáveis e registros exclusivamente fictícios.</p><InitiativeList initiatives={data.risks} /></>}
        {selection.kind === "health" && <HealthDetails health={overview.health.filter(item => selection.level === "unassessed" ? item.overall === null : item.overall === selection.level)} />}
        {selection.kind === "alert" && <AlertDetails group={overview.alerts.find(item => item.kind === selection.category)!} />}
      </DetailDrawer>}
    </div>
  );
}
