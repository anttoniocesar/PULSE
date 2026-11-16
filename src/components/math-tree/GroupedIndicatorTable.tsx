import { compareUnitCosts, formatMathNumber } from "../../utils/mathTreeCalculations";

export type IndicatorGroup = {
  id: string;
  label: string;
  description?: string;
  indicators: { id: string; label: string; budget: number | null; forecast: number | null; decimals?: number; compareCosts?: boolean }[];
};

export default function GroupedIndicatorTable({ label, scenario, groups }: { label: string; scenario: string; groups: IndicatorGroup[] }) {
  return <table className="math-node-table logistics-node__table grouped-indicator-table nodrag nopan" aria-label={label}>
    <colgroup><col className="grouped-indicator-unit" /><col className="grouped-indicator-label" /><col /><col /></colgroup>
    <thead><tr><th scope="col">Unidade</th><th scope="col">Indicador</th><th scope="col">BDG</th><th scope="col">{scenario}</th></tr></thead>
    {groups.map(group => <tbody key={group.id} aria-label={group.description ?? group.label}>
      {group.indicators.map((indicator, index) => {
        const comparison = indicator.compareCosts ? compareUnitCosts(indicator.budget, indicator.forecast) : null;
        return <tr key={indicator.id}>
          {index === 0 && <th className="grouped-indicator-unit-name" scope="rowgroup" rowSpan={group.indicators.length} title={group.description}>{group.label}</th>}
          <th className="grouped-indicator-name" scope="row">{indicator.label}</th>
          <td className={comparison ? `math-unit-cost--${comparison.budget}` : undefined}>{formatMathNumber(indicator.budget, indicator.decimals ?? 2)}</td>
          <td className={comparison ? `math-unit-cost--${comparison.forecast}` : undefined}>{formatMathNumber(indicator.forecast, indicator.decimals ?? 2)}</td>
        </tr>;
      })}
    </tbody>)}
  </table>;
}
