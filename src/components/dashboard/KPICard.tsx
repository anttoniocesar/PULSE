import { ArrowUpRight, Target, CircleCheck, TrendingUp, Layers3, ChartPie, TriangleAlert, BadgeCheck, Clock3, CirclePause } from "lucide-react";
import { getMetricValue, type DashboardData, type metrics } from "../../data/demoData";

const icons = { potential: Target, realized: CircleCheck, forecast: TrendingUp, initiatives: Layers3, capture: ChartPie, risk: TriangleAlert, onBudget: BadgeCheck, delayed: Clock3, interrupted: CirclePause };
type Metric = (typeof metrics)[number];
export default function KPICard({ metric, data, onClick }: { metric: Metric; data: DashboardData; onClick: () => void }) {
  const Icon = icons[metric.key];
  return (
    <button className={`kpi-card kpi-card--${metric.key}`} onClick={onClick} aria-label={`Detalhar ${metric.title}`}>
      <span className="kpi-card__top"><span>{metric.title}</span><span className="kpi-card__icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span></span>
      <strong className="kpi-card__value">{getMetricValue(metric.key, data)}</strong>
      <span className="kpi-card__bottom"><span>{metric.caption}</span><ArrowUpRight size={16} aria-hidden="true" /></span>
    </button>
  );
}
