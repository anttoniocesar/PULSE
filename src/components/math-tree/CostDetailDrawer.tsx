import { CircleAlert } from "lucide-react";
import DetailDrawer from "../dashboard/DetailDrawer";
import { costComponents, mathTreeSource, productionInputs, sourceValidationNotes, type MathNodeId, type MathTreeUnit } from "../../data/mathTreeTrefilarias";
import { calculateVariance, componentTotals, formatMathMoney, formatMathNumber, formatSignedMoney, formatVariancePercent, productionTotals, reconciliationIssues, selectedRows, unitCostDiagnostic } from "../../utils/mathTreeCalculations";
import VarianceBadge from "./VarianceBadge";

export default function CostDetailDrawer({ id, unit, onClose }: { id: MathNodeId; unit: MathTreeUnit; onClose: () => void }) {
  const component = costComponents.find(item => item.id === id);
  const production = id === "production";
  const totals = component ? componentTotals(component, unit) : productionTotals(unit);
  const title = component?.name ?? "Produção (t)";
  const issues = component ? reconciliationIssues(component, unit) : [];
  return (
    <DetailDrawer title={title} context={`Trefilarias · MRF04 · ${unit === "all" ? "Todas as unidades" : unit}`} onClose={onClose}>
      <div className="math-detail-summary"><div><span>BDG{production ? " (t)" : " (R$)"}</span><strong>{production ? formatMathNumber(totals.budget) : formatMathMoney(totals.budget)}</strong></div><div><span>MRF04{production ? " (t)" : " (R$)"}</span><strong>{production ? formatMathNumber(totals.forecast) : formatMathMoney(totals.forecast)}</strong></div></div>
      <div className="math-detail-variance"><span>{production ? "Variação de volume" : "Desvio absoluto"}</span><strong>{production ? `${formatMathNumber(totals.absolute)} t` : formatSignedMoney(totals.absolute)}</strong><VarianceBadge variance={totals} production={production} /></div>
      {component && selectedRows(component, unit).map(row => {
        const variance = calculateVariance(row.budget.absolute, row.forecast.absolute);
        const budgetDiagnostic = unitCostDiagnostic(row, "budget"), forecastDiagnostic = unitCostDiagnostic(row, "forecast");
        const quantities = productionInputs.find(item => item.unit === row.unit)!;
        return <section key={row.unit} className="math-detail-unit"><h3>Unidade {row.unit}</h3><dl>
          <div><dt>BDG absoluto</dt><dd>{formatMathMoney(row.budget.absolute)}</dd></div><div><dt>MRF04 absoluto</dt><dd>{formatMathMoney(row.forecast.absolute)}</dd></div>
          <div><dt>Variação absoluta</dt><dd>{formatSignedMoney(variance.absolute)}</dd></div><div><dt>Variação percentual</dt><dd>{formatVariancePercent(variance.percent)}</dd></div>
          <div><dt>BDG informado · R$/t</dt><dd>{formatMathNumber(row.budget.referenceUnitCost, row.budget.unitDecimals)}</dd></div><div><dt>MRF04 informado · R$/t</dt><dd>{formatMathNumber(row.forecast.referenceUnitCost, row.forecast.unitDecimals)}</dd></div>
          <div><dt>Produção BDG / MRF04 · t</dt><dd>{formatMathNumber(quantities.budget)} / {formatMathNumber(quantities.forecast)}</dd></div>
        </dl><details className="math-unit-diagnostic"><summary>Conferir razão indicativa custo / produção</summary><p>Base de alocação não confirmada. Estas razões são diagnósticos e não substituem os valores informados.</p><dl><div><dt>BDG indicativo · R$/t</dt><dd>{formatMathNumber(budgetDiagnostic.indicative, 2)}</dd></div><div><dt>MRF04 indicativo · R$/t</dt><dd>{formatMathNumber(forecastDiagnostic.indicative, 2)}</dd></div></dl>{(budgetDiagnostic.differs || forecastDiagnostic.differs) && <p className="math-review-note"><CircleAlert size={14} />Diferença além do arredondamento informado. Validar na origem.</p>}</details></section>;
      })}
      {production && <section className="math-detail-unit"><h3>Volumes de referência</h3><dl>{productionInputs.filter(row => unit === "all" || row.unit === unit).map(row => <div key={row.unit}><dt>{row.unit} · BDG / MRF04</dt><dd>{formatMathNumber(row.budget)} / {formatMathNumber(row.forecast)} t</dd></div>)}</dl><p>A variação de produção representa volume; não recebe classificação automática de favorabilidade de custos.</p></section>}
      {issues.length > 0 && <section className="math-detail-unit"><h3><CircleAlert size={14} />Reconciliação a validar</h3><p>A soma dos filhos difere do valor informado no pai. Não foi aplicado ajuste automático.</p><ul className="math-reconciliation-list">{issues.map(issue => <li key={`${issue.unit}-${issue.scenario}`}>{issue.unit} · {issue.scenario === "budget" ? "BDG" : "MRF04"}: diferença de {formatSignedMoney(issue.difference)}.</li>)}</ul></section>}
      <section className="math-detail-source"><h3>Origem e validação</h3><p>{mathTreeSource.note}</p><ul>{sourceValidationNotes.map(note => <li key={note}>{note}</li>)}</ul><p>Protótipo de leitura e comparação. Nenhum motor de rateio ou análise de causa raiz foi implementado.</p></section>
    </DetailDrawer>
  );
}
