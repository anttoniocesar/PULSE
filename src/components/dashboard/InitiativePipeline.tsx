import { ArrowUpRight } from "lucide-react";
import { formatNumber, type Stage } from "../../data/demoData";
import { maturityDefinitions } from "../../data/overviewData";
import type { OverviewData } from "../../utils/overviewCalculations";

export default function InitiativePipeline({ maturity, total, onSelect }: { maturity: OverviewData["maturity"]; total: number; onSelect: (stage: Stage) => void }) {
  return (
    <section className="dashboard-card pipeline-card" aria-labelledby="pipeline-title">
      <div className="dashboard-card__heading"><div><h2 id="pipeline-title">Maturidade das Iniciativas</h2><p>Estágio atual da carteira · cada iniciativa é contabilizada uma única vez</p></div><span className="dashboard-card__tag">{total} iniciativas</span></div>
      <div className="pipeline-stages">
        {maturity.stages.map(({ stage, count, percent }) => (
          <button key={stage} className={`pipeline-stage pipeline-stage--${stage.toLowerCase()} overview-maturity-stage`} onClick={() => onSelect(stage)} aria-label={`${stage}: ${count} iniciativas — ${maturityDefinitions[stage].label}`} aria-describedby={`maturity-tooltip-${stage}`}>
            <span className="pipeline-stage__top"><span>{stage}</span><ArrowUpRight size={14} aria-hidden="true" /></span>
            <strong>{count}</strong><span className="pipeline-stage__label">{maturityDefinitions[stage].label}</span><span className="overview-maturity-percent">{formatNumber(percent)}% do total</span>
            <span className="pipeline-stage__track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span><span role="tooltip" id={`maturity-tooltip-${stage}`} className="overview-maturity-tooltip">{maturityDefinitions[stage].description}</span>
          </button>
        ))}
      </div>
      {total === 0 && <p className="overview-empty">Nenhuma iniciativa disponível para os filtros selecionados.</p>}
      {maturity.unclassified > 0 && <p className="overview-note">{maturity.unclassified} iniciativas sem estágio informado. Nenhum estágio foi inferido.</p>}
    </section>
  );
}
