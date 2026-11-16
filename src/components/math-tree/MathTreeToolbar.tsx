import { Building2, Expand, FoldVertical, Layers3, Maximize, RefreshCw } from "lucide-react";
import { industrialUnits, type MathTreeUnit } from "../../data/mathTreeTrefilarias";

type Props = { unit: MathTreeUnit; onUnit: (unit: MathTreeUnit) => void; onRefresh: () => void; onExpand: () => void; onCollapse: () => void; onFit: () => void };
export default function MathTreeToolbar({ unit, onUnit, onRefresh, onExpand, onCollapse, onFit }: Props) {
  return (
    <div className="math-toolbar" aria-label="Controles da árvore">
      <div className="math-toolbar__filters">
        <label className="math-select"><Building2 size={16} aria-hidden="true" /><select aria-label="Negócio" defaultValue="trefilarias"><option value="trefilarias">Trefilarias</option></select></label>
        <label className="math-select"><Layers3 size={16} aria-hidden="true" /><select aria-label="Cenário" defaultValue="MRF04"><option value="MRF04">MRF04</option></select></label>
        <label className={`math-select${unit !== "all" ? " math-select--active" : ""}`}><span>Unidade</span><select aria-label="Unidade industrial" value={unit} onChange={event => onUnit(event.target.value as MathTreeUnit)}><option value="all">Todas as unidades</option>{industrialUnits.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="math-toolbar__actions">
        <button className="math-action math-action--primary" onClick={onRefresh}><RefreshCw size={15} />Atualizar</button>
        <button className="math-action" onClick={onExpand}><Expand size={15} />Expandir tudo</button>
        <button className="math-action" onClick={onCollapse}><FoldVertical size={15} />Recolher tudo</button>
        <button className="math-action" onClick={onFit}><Maximize size={15} />Ajustar à tela</button>
      </div>
    </div>
  );
}
