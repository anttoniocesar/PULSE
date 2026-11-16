import { ArrowDownRight, ArrowUpRight, ChevronRight, Target } from "lucide-react";
import type { CostNodeId, MathTreeUnit } from "../../data/mathTreeTrefilarias";
import { formatSignedMoney, formatVariancePercent, largestVariances } from "../../utils/mathTreeCalculations";

export default function VariancePanel({ unit, onClose, onDetails }: { unit: MathTreeUnit; onClose: () => void; onDetails: (id: CostNodeId) => void }) {
  const items = largestVariances(unit);
  return (
    <aside className="math-variance-panel" aria-labelledby="variance-panel-title">
      <header><Target size={23} strokeWidth={1.7} aria-hidden="true" /><div><h2 id="variance-panel-title">Maiores Desvios</h2><p>MRF04 vs. BDG · {unit === "all" ? "Todas as unidades" : unit}</p></div><button className="dashboard-icon-button" onClick={onClose} aria-label="Recolher painel de desvios" title="Recolher painel"><ChevronRight size={18} /></button></header>
      <p className="math-variance-panel__note">Componentes finais · variação absoluta em R$. Ordenados por magnitude, sem duplicar totais e subtotais.</p>
      <ol>{items.map(item => {
        const Icon = item.favorable === "favorable" ? ArrowDownRight : ArrowUpRight;
        return <li key={item.component.id}><button onClick={() => onDetails(item.component.id)} className="math-variance-item"><span className={`math-variance-dot math-variance-dot--${item.favorable}`} /><span><strong>{item.component.name}</strong><span className="math-variance-item__amount">{formatSignedMoney(item.absolute)}</span><span className={`math-variance-item__assessment math-variance-item__assessment--${item.favorable}`}><Icon size={12} aria-hidden="true" />{formatVariancePercent(item.percent)} · {item.favorable === "favorable" ? "Favorável" : item.favorable === "unfavorable" ? "Desfavorável" : "Neutro"}</span></span></button></li>;
      })}</ol>
      <footer>Comparação dos valores de referência. Causas operacionais não avaliadas.</footer>
    </aside>
  );
}
