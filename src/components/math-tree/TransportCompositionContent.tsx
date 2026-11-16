import { logisticsUnits, type LogisticsContext } from "../../data/logisticsTree";
import { transportCompositions, type TransportComponentId } from "../../data/transportComposition";
import { getTransportFactors } from "../../utils/transportCalculations";
import GroupedIndicatorTable, { type IndicatorGroup } from "./GroupedIndicatorTable";

export function TransportCostContent({ id, context }: { id: TransportComponentId; context: LogisticsContext }) {
  const composition = transportCompositions.find(item => item.id === id)!;
  const groups: IndicatorGroup[] = logisticsUnits.filter(unit => context.unit === "all" || context.unit === unit.sourceCode).map(unit => {
    const input = getTransportFactors(id, unit.sourceCode, context);
    return {
      id: unit.sourceCode, label: unit.code, description: unit.name,
      indicators: [
        { id: "quantity", label: composition.quantityLabel, budget: input?.budget.quantity ?? null, forecast: input?.forecast.quantity ?? null },
        { id: "price", label: composition.priceLabel, budget: input?.budget.unitPrice ?? null, forecast: input?.forecast.unitPrice ?? null, compareCosts: true },
      ],
    };
  });
  return <>
    <GroupedIndicatorTable label={`${composition.id === "support-machines" ? "Máquinas de Apoio" : "Transporte de Bobinas"}: indicadores físicos e econômicos por unidade`} scenario={context.scenario} groups={groups} />
    <p className="transport-formula">Custo = {composition.formula}</p>
  </>;
}
