import { ArrowUpRight, CircleHelp } from "lucide-react";
import { dimensionLabels, healthLabels, type HealthLevel } from "../../data/overviewData";
import type { InitiativeHealth } from "../../utils/overviewCalculations";
import { executionStatusLabels } from "../../data/demoData";

export default function PortfolioHealth({ health, onSelect }: { health: InitiativeHealth[]; onSelect: (level: HealthLevel | "unassessed") => void }) {
  const complete = health.filter(item => item.overall !== null).length;
  return <section className="dashboard-card overview-health" aria-labelledby="portfolio-health-title">
    <div className="dashboard-card__heading"><div><h2 id="portfolio-health-title">Saúde do Portfólio</h2><p>Pior classificação entre prazo, resultado financeiro e risco · somente avaliações completas</p></div><span className="dashboard-card__tag">{complete} de {health.length} avaliadas</span></div>
    <div className="overview-health__levels">{(["onTrack", "attention", "critical"] as const).map(level => <button key={level} className={`overview-health-level overview-health-level--${level}`} onClick={() => onSelect(level)} aria-label={`Detalhar saúde ${healthLabels[level]}`}><span><i />{healthLabels[level]}<ArrowUpRight size={14} /></span><strong>{health.filter(item => item.overall === level).length}</strong><small>avaliações completas</small></button>)}</div>
    <button className="overview-coverage" onClick={() => onSelect("unassessed")}><CircleHelp size={17} /><span><strong>{health.length - complete} sem avaliação completa</strong><span>Dados ausentes não são considerados desempenho favorável. Consultar cobertura por iniciativa.</span></span><ArrowUpRight size={15} /></button>
  </section>;
}

export function HealthDetails({ health }: { health: InitiativeHealth[] }) {
  return <div className="overview-detail-list"><p className="drawer-context-note">{health.length} iniciativas. A classificação geral exige as três dimensões; sinais demonstrativos existentes não substituem uma avaliação executiva validada.</p>{health.length === 0 && <p className="overview-empty">Nenhuma iniciativa com esta classificação na seleção. Avaliações incompletas podem ser consultadas na cobertura.</p>}
    {health.map(item => <article className="overview-detail-record" key={item.initiative.id}><div className="overview-record-meta">{item.initiative.id} · Unidade {item.initiative.unit}</div><h3>{item.initiative.name}</h3><p>{item.initiative.owner || "Responsável não informado"}</p><strong className={item.overall ? `overview-state--${item.overall}` : ""}>{item.overall ? healthLabels[item.overall] : "Avaliação incompleta"} · {item.coverage}/3 dimensões</strong><p>{item.reason}</p><dl>{item.assessments.map(assessment => <div key={assessment.dimension}><dt>{dimensionLabels[assessment.dimension]}</dt><dd>{assessment.level ? healthLabels[assessment.level] : "Não informado"}</dd></div>)}<div><dt>Última atualização</dt><dd>{item.updatedAt ? item.updatedAt.split("-").reverse().join("/") : "Não informado"}</dd></div></dl><p>Sinais da base demonstrativa: {executionStatusLabels[item.initiative.executionStatus]} · {item.initiative.atRisk ? item.initiative.reason : "Sem risco sinalizado"}.</p></article>)}
  </div>;
}
