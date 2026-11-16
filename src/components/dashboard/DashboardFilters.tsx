import { Building2, CalendarDays, SlidersHorizontal } from "lucide-react";
import { periodOptions, unitOptions, type Period, type Unit } from "../../data/demoData";

type Props = { unit: Unit; period: Period; onUnitChange: (value: Unit) => void; onPeriodChange: (value: Period) => void };
export default function DashboardFilters({ unit, period, onUnitChange, onPeriodChange }: Props) {
  return (
    <section className="dashboard-filters" aria-label="Filtros globais">
      <span className="dashboard-filters__label"><SlidersHorizontal size={16} aria-hidden="true" />Visão da carteira</span>
      <div className="dashboard-filter-fields">
        <label className={unit !== "all" ? "dashboard-filter dashboard-filter--selected" : "dashboard-filter"}>
          <Building2 size={16} aria-hidden="true" /><span>Unidade</span>
          <select value={unit} onChange={event => onUnitChange(event.target.value as Unit)} aria-label="Unidade">
            {unitOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={period !== "YTD" ? "dashboard-filter dashboard-filter--selected" : "dashboard-filter"}>
          <CalendarDays size={16} aria-hidden="true" /><span>Período</span>
          <select value={period} onChange={event => onPeriodChange(event.target.value as Period)} aria-label="Período">
            {periodOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <span className="dashboard-data-note"><span />Dados simulados · corte set/2026</span>
    </section>
  );
}
