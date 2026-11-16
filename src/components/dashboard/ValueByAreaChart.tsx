import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatNumber, type DashboardData } from "../../data/demoData";

export default function ValueByAreaChart({ data }: { data: DashboardData }) {
  return (
    <section className="dashboard-card value-area-card" aria-labelledby="area-chart-title">
      <div className="dashboard-card__heading"><div><h2 id="area-chart-title">Value by Area</h2><p>Potencial validado · R$ milhões</p></div><strong className="area-total">{formatMoney(data.potential)}</strong></div>
      <div className="dashboard-chart dashboard-chart--area" aria-label="Potencial validado por área; os dados também estão disponíveis na tabela abaixo">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 400, height: 250 }}>
          <BarChart data={data.areas} layout="vertical" margin={{ top: 10, right: 38, left: 0, bottom: 0 }} barSize={14} accessibilityLayer>
            <CartesianGrid horizontal={false} stroke="#edf1f5" strokeDasharray="3 4" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718598" }} domain={[0, max => Math.ceil(Number(max) * 1.12)]} />
            <YAxis type="category" dataKey="name" width={93} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#526b7d" }} />
            <Tooltip formatter={value => formatMoney(Number(value))} cursor={{ fill: "#f5f8fb" }} contentStyle={{ borderRadius: 8, border: "1px solid #e5ebf0", fontSize: 12 }} />
            <Bar dataKey="value" name="Potencial validado" fill="#2785BD" radius={[0, 4, 4, 0]} isAnimationActive={false}><LabelList dataKey="value" position="right" formatter={value => formatNumber(Number(value))} fill="#526b7d" fontSize={11} /></Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="dashboard-chart-footnote"><span>Contribuição para o potencial total</span><details className="dashboard-chart-data"><summary>Ver dados</summary><table><caption>Potencial validado em R$ milhões</caption><thead><tr><th>Área</th><th>Potencial</th></tr></thead><tbody>{data.areas.map(area => <tr key={area.name}><th>{area.name}</th><td>{formatNumber(area.value)}</td></tr>)}</tbody></table></details></div>
    </section>
  );
}
