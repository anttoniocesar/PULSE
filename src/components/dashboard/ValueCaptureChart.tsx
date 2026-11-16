import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatNumber, type DashboardData } from "../../data/demoData";
import "./ValueCaptureChart.css";
import type { OverviewData } from "../../utils/overviewCalculations";
type CapturePoint = OverviewData["capture"][number];

export default function ValueCaptureChart({ data, capture }: { data: DashboardData; capture?: CapturePoint[] }) {
  const [simulationOpen, setSimulationOpen] = useState(false);
  return (
    <section className="dashboard-card value-capture-card" aria-labelledby="capture-trend-title">
      <div className="dashboard-card__heading value-capture-heading">
        <div className="value-capture-heading__title">
          <h2 id="capture-trend-title">{capture === undefined ? "Value Capture Trend" : "Evolução da Captura de Valor"}</h2>
          <p>Acumulado de 2026 - R$ milhões{capture !== undefined && " · KPIs demonstrativos preservados"}</p>
        </div>
        <section className="value-capture-summary" aria-labelledby="capture-summary-title">
          <h3 id="capture-summary-title">Visão de Fechamento</h3>
          <dl>
            <div className="value-capture-summary__forecast">
              <dt>Projetado no Ano</dt>
              <dd>{formatMoney(data.forecast)}</dd>
            </div>
            <div className="value-capture-summary__realized">
              <dt>Capturado no Ano</dt>
              <dd>{formatMoney(data.realized)}</dd>
            </div>
          </dl>
        </section>
      </div>
      {capture === undefined ? <CapturePlot data={data} /> : <>
        {capture.length === 0 || !capture.some(point => point.planned !== null || point.realized !== null || point.forecast !== null) ? <div className="overview-empty overview-empty--chart"><strong>Histórico operacional não informado</strong><p>Aguardando planejamento temporal e fechamentos acumulados da fonte. Valores anuais não são distribuídos automaticamente entre os meses.</p></div> : <CapturePlot data={data} points={capture} />}
        <details className="overview-simulation" onToggle={event => setSimulationOpen(event.currentTarget.open)}><summary>Consultar série simulada existente</summary><p className="overview-note">Simulação anterior preservada para consulta. As curvas utilizam proporções demonstrativas e não representam histórico operacional validado.</p>{simulationOpen && <CapturePlot data={data} />}</details>
      </>}

    </section>
  );
}

// Shared renderer for the preserved demo and future source-supplied closings.
function CapturePlot({ data, points }: { data: DashboardData; points?: CapturePoint[] }) {
  const series: Pick<CapturePoint, "month" | "planned" | "realized" | "forecast">[] = points ?? data.trend;
  const forecastAvailable = !points || points.some(point => point.forecast !== null);
  const plannedLabel = points ? "Esperado acumulado" : "Planejado";
  const actualLabel = points ? "Realizado acumulado" : "Realizado";
  const periodLabel = (value: string) => /^\d{4}-\d{2}$/.test(value) ? `${value.slice(5)}/${value.slice(0, 4)}` : value;
  const format = (value: number | null) => value === null ? "Não informado" : formatMoney(value);
  const cell = (value: number | null) => points ? format(value) : value === null ? "—" : formatNumber(value);
  return <>
    <div className="dashboard-chart-legend" aria-label="Séries do gráfico"><span><i className="legend-planned" />{plannedLabel}</span><span><i className="legend-realized" />{actualLabel}</span>{forecastAvailable && <span><i className="legend-forecast" />Forecast</span>}</div>
    <div className="dashboard-chart" aria-label="Gráfico de captura de valor acumulado; valores e desvios disponíveis na tabela abaixo">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 240 }}>
        <LineChart data={series} margin={{ top: 12, right: 12, left: -17, bottom: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#edf1f5" strokeDasharray="3 4" />
          <XAxis dataKey="month" tickFormatter={points ? periodLabel : undefined} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718598" }} interval="preserveStartEnd" minTickGap={16} dy={8} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={value => formatNumber(Number(value), 0)} tick={{ fontSize: 10, fill: "#718598" }} width={48} />
          <Tooltip formatter={value => formatMoney(Number(value))} labelFormatter={label => `${label} · 2026`} contentStyle={{ borderRadius: 8, border: "1px solid #e5ebf0", fontSize: 12 }} content={points ? ({ active, label }) => {
            const point = points.find(item => item.month === label);
            return active && point ? <div className="overview-chart-tooltip"><strong>{periodLabel(point.month)}</strong><p>Esperado: {format(point.planned)}</p><p>Realizado: {format(point.realized)}</p>{forecastAvailable && <p>Forecast: {format(point.forecast)}</p>}<p className={point.variance !== null && point.variance < 0 ? "overview-state--critical" : ""}>Desvio: {format(point.variance)}{point.variancePercent !== null && ` (${formatNumber(point.variancePercent)}%)`}</p></div> : null;
          } : undefined} />
          {!points && <ReferenceLine x="Set" stroke="#dbe4eb" strokeDasharray="4 5" />}
          <Line dataKey="planned" name={plannedLabel} stroke="#a6b3bf" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
          <Line dataKey="realized" name={actualLabel} stroke="#2785bd" strokeWidth={3} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} isAnimationActive={false} connectNulls={false} dot={points ? ({ cx, cy, payload }) => typeof cx === "number" && typeof cy === "number" ? <circle key={payload.month} cx={cx} cy={cy} r={3} fill={payload.variance !== null && payload.variance < 0 ? "#dc6464" : "#2785bd"} /> : <g key={payload.month} /> : false} />
          {forecastAvailable && <Line dataKey="forecast" name="Forecast" stroke="#38d5ca" strokeWidth={2.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} connectNulls={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="dashboard-chart-footnote">{points ? <p className="overview-note">Desvio = realizado − esperado. Pontos vermelhos indicam desvios desfavoráveis. Valores ausentes não são preenchidos nem considerados zero.</p> : <span>Realizado até set. · out–dez são projeções</span>}
      <details className="dashboard-chart-data"><summary>{points ? "Ver dados e desvios" : "Ver dados"}</summary><div className="dashboard-table-wrap"><table><caption>{points ? "Fechamentos acumulados informados" : "Captura acumulada"} · R$ milhões</caption><thead><tr><th>{points ? "Período" : "Mês"}</th><th>{plannedLabel}</th><th>{actualLabel}</th>{forecastAvailable && <th>Forecast</th>}{points && <><th>Desvio</th><th>Desvio %</th></>}</tr></thead><tbody>{series.map(point => {
        const deviation = points?.find(item => item.month === point.month);
        return <tr key={point.month}><th>{periodLabel(point.month)}</th><td>{cell(point.planned)}</td><td>{cell(point.realized)}</td>{forecastAvailable && <td>{cell(point.forecast)}</td>}{deviation && <><td className={deviation.variance !== null && deviation.variance < 0 ? "overview-state--critical" : ""}>{format(deviation.variance)}</td><td>{deviation.variancePercent === null ? "Não informado" : `${formatNumber(deviation.variancePercent)}%`}</td></>}</tr>;
      })}</tbody></table></div></details>
    </div>
  </>;
}

