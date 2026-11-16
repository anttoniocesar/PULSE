import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, ChevronRight, Compass, Expand, FoldVertical, Info } from "lucide-react";
import { formatMoney, formatNumber, periodOptions, unitOptions, type Period, type Unit } from "../../data/demoData";
import { strategicConfiguration, strategicSource, type StrategicConfiguration, type StrategicSource, type StrategyDefinition } from "../../data/strategicAlignment";
import { getStrategicAlignment, selectStrategicGroup, type StrategicAlignmentView, type StrategyGroup, type StrategySelection } from "../../utils/strategicAlignment";
import DetailDrawer from "./DetailDrawer";
import "../../styles/strategic-alignment.css";

const unavailable = "Dados não disponíveis";
const count = (value: number | null) => value === null ? unavailable : formatNumber(value, 0);
const coveredCount = (value: number | null, complete: boolean) => value !== null && value > 0 && !complete ? `≥ ${count(value)}` : count(value);
const money = (value: number | null) => value === null ? unavailable : formatMoney(value);
const projectType = (value: string | null) => value === "transformational" ? "Transformacional" : value === "incremental" ? "Incremental" : "Não classificado";
type SelectionHandler = (selection: StrategySelection) => void;

function StrategyNode({ definition, summary, root = false, expanded, onToggle, active, onSelect }: {
  definition: StrategyDefinition; summary: StrategyGroup; root?: boolean; expanded?: boolean; onToggle?: () => void; active: boolean; onSelect: () => void;
}) {
  const tooltipId = useId();
  const metrics = root ? [
    ["Projetos priorizados", coveredCount(summary.prioritized, summary.complete && summary.priorityCoverage === summary.projects.length)], ["Transformacionais", coveredCount(summary.transformational, summary.complete && summary.typeCoverage === summary.projects.length)], ["Incrementais", coveredCount(summary.incremental, summary.complete && summary.typeCoverage === summary.projects.length)], ["Valor associado", money(summary.associatedValue)],
  ] : [
    ["Projetos associados", coveredCount(summary.count, summary.complete)], ["Transformacionais", coveredCount(summary.transformational, summary.complete && summary.typeCoverage === summary.projects.length)], ["Incrementais", coveredCount(summary.incremental, summary.complete && summary.typeCoverage === summary.projects.length)], ["Benefício realizado", money(summary.realized)], ["Forecast", money(summary.forecast)], ["Desvio vs. previsto", summary.performance === null ? unavailable : `${formatNumber(summary.performance)}%`],
  ];
  return <article className={`strategy-node${root ? " strategy-node--root" : ""}${active ? " strategy-node--selected" : ""}${expanded ? " strategy-node--expanded" : ""}`} data-strategy-node={definition.id} onClick={onSelect}>
    <div className="strategy-node__heading"><button type="button" className="strategy-node__title" onClick={event => { event.stopPropagation(); onSelect(); }} aria-pressed={active} aria-describedby={tooltipId}>{root && <Compass size={18} aria-hidden="true" />}<span>{definition.label}</span><Info size={12} aria-hidden="true" /></button>{onToggle && <button type="button" className="strategy-node__toggle" onClick={event => { event.stopPropagation(); onToggle(); }} aria-label={`${expanded ? "Recolher" : "Expandir"} ${definition.label}`} aria-expanded={expanded}>{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>}<span role="tooltip" className="strategy-tooltip" id={tooltipId}>{definition.description}{!root && " Desvio financeiro = (realizado / previsto − 1) × 100; requer base positiva informada."}</span></div>
    <dl className="strategy-node__metrics">{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {summary.count !== null && <p className="strategy-node__coverage">{root ? `${summary.count} projetos únicos conhecidos · ` : ""}{!summary.complete && "Base parcial · "}{summary.typeCoverage}/{summary.count} com tipo informado{root && ` · ${summary.priorityCoverage}/${summary.count} com priorização informada`}</p>}
  </article>;
}

export default function StrategicAlignment({ unit, period, source = strategicSource, config = strategicConfiguration }: { unit: Unit; period: Period; source?: StrategicSource; config?: StrategicConfiguration }) {
  const [area, setArea] = useState("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<StrategySelection | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const canvas = useRef<HTMLDivElement>(null);
  const view = useMemo(() => getStrategicAlignment(unit, period, area, source, config), [unit, period, area, source, config]);
  const selection = selected ? selectStrategicGroup(view, selected) : undefined;
  useEffect(() => { if (area !== view.effectiveArea) setArea(view.effectiveArea); }, [area, view.effectiveArea]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let previousWidth = -1;
    const resize = new ResizeObserver(() => {
      if (Math.abs(element.clientWidth - previousWidth) < 1) return;
      previousWidth = element.clientWidth;
      element.style.setProperty("--strategy-viewport-width", `${element.clientWidth}px`);
      element.scrollLeft = Math.max(0, (element.scrollWidth - element.clientWidth) / 2);
    });
    resize.observe(element);
    return () => resize.disconnect();
  }, []);
  const isSelected = (kind: StrategySelection["kind"], id?: string) => selected?.kind === kind && (selected.kind === "root" || selected.id === id);
  const choose: SelectionHandler = value => { setSelected(value); setDetailsOpen(true); };
  const toggle = (id: string) => setCollapsed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <section className="dashboard-card strategic-alignment" aria-labelledby="strategic-alignment-title">
    <div className="dashboard-card__heading"><div><h2 id="strategic-alignment-title">Alinhamento Estratégico do Portfólio</h2><p>Conexão entre projetos, direcionadores de valor e pilares estratégicos · valores em R$ milhões</p></div><Compass size={22} className="strategy-section-icon" aria-hidden="true" /></div>
    <div className="strategy-toolbar"><p className="overview-note">{!view.known ? "Cadastro de projetos e classificações estratégicas ainda não disponíveis. Iniciativas não são convertidas automaticamente em projetos." : `${view.root.count === null ? "Quantidade não disponível" : `${view.root.count} projetos únicos conhecidos`} · ${view.unclassifiedCategories} sem categoria válida · ${view.unclassifiedPillars} sem pilar válido.`}</p><div className="strategy-toolbar__actions"><button type="button" className="dashboard-button" onClick={() => setCollapsed(new Set())}><Expand size={14} />Expandir tudo</button><button type="button" className="dashboard-button" onClick={() => setCollapsed(new Set([config.root.id, ...config.drivers.map(driver => driver.id)]))}><FoldVertical size={14} />Recolher tudo</button></div></div>
    {view.areas.length > 0 && <label className="strategy-area-filter">Área dos projetos <select aria-label="Área do alinhamento estratégico" value={view.effectiveArea} onChange={event => setArea(event.target.value)}><option value="all">Todas as áreas</option>{view.areas.map(value => <option key={value}>{value}</option>)}</select><span>Aplica-se somente a esta árvore e aos pilares.</span></label>}
    <div className="strategy-canvas" ref={canvas} tabIndex={0} role="region" aria-label="Árvore de alinhamento estratégico. Role horizontalmente para explorar os nós.">
      <div className="strategy-tree">
        <div className="strategy-root-row"><StrategyNode definition={config.root} summary={view.root} root expanded={!collapsed.has(config.root.id)} onToggle={() => toggle(config.root.id)} active={isSelected("root")} onSelect={() => choose({ kind: "root" })} /></div>
        {!collapsed.has(config.root.id) && <div className="strategy-siblings strategy-drivers" style={{ "--strategy-columns": config.drivers.length } as CSSProperties}>{view.drivers.map(driver => <div className="strategy-branch" key={driver.id}>
          <StrategyNode definition={driver} summary={driver.summary} expanded={!collapsed.has(driver.id)} onToggle={() => toggle(driver.id)} active={isSelected("driver", driver.id)} onSelect={() => choose({ kind: "driver", id: driver.id })} />
          {!collapsed.has(driver.id) && <div className="strategy-siblings strategy-leaves" style={{ "--strategy-columns": driver.categories.length } as CSSProperties}>{driver.categories.map(category => <div className="strategy-branch" key={category.id}><StrategyNode definition={category} summary={category.summary} active={isSelected("category", category.id)} onSelect={() => choose({ kind: "category", id: category.id })} /></div>)}</div>}
        </div>)}</div>}
      </div>
    </div>
    <p className="strategy-pan-hint">Deslize horizontalmente para explorar a árvore em telas menores. As setas expandem os ramos; os títulos abrem os projetos.</p>
    <div className="strategy-pillars-heading"><h3>Pilares estratégicos</h3><p>Um projeto pode participar de vários pilares. Contagens e benefícios dos pilares não devem ser somados; o total geral conta cada projeto uma única vez.</p></div>
    <div className="strategy-pillars">{view.pillars.map(pillar => <button key={pillar.id} type="button" className={`strategy-pillar${isSelected("pillar", pillar.id) ? " strategy-pillar--selected" : ""}`} onClick={() => choose({ kind: "pillar", id: pillar.id })} aria-pressed={isSelected("pillar", pillar.id)} title={pillar.description}><span>{pillar.label}</span><strong>{coveredCount(pillar.summary.count, pillar.summary.complete)}</strong><small>{pillar.summary.coveragePercent === null ? "Cobertura não disponível" : `${formatNumber(pillar.summary.coveragePercent)}% do portfólio`}</small><span className="strategy-pillar__value">Valor associado: {money(pillar.summary.associatedValue)}</span>{!pillar.summary.complete && <small>Classificação não informada ou parcial</small>}</button>)}</div>
    {detailsOpen && selection && <DetailDrawer title={selection.label} context={`${unitOptions.find(option => option.value === unit)?.label} · ${periodOptions.find(option => option.value === period)?.label}${view.effectiveArea !== "all" ? ` · ${view.effectiveArea}` : ""}`} onClose={() => setDetailsOpen(false)}><StrategicProjectDetails view={view} summary={selection.summary} /></DetailDrawer>}
  </section>;
}

function StrategicProjectDetails({ view, summary }: { view: StrategicAlignmentView; summary: StrategyGroup }) {
  const labels = (ids: readonly string[] | null, definitions: readonly StrategyDefinition[]) => ids?.length ? ids.map(id => definitions.find(definition => definition.id === id)?.label ?? `Não classificado (${id})`).join(" · ") : "Não classificado";
  return <div className="strategy-project-details"><p className="drawer-context-note">{summary.count === null ? "Quantidade não disponível: cadastro ou classificações ainda não carregados." : `${summary.count} projetos únicos conhecidos nesta seleção.`} {!summary.complete && "A cobertura é incompleta; totais financeiros e percentuais não são inferidos."} Nenhum projeto ou benefício é deduzido dos KPIs agregados das iniciativas.</p>{summary.projects.length === 0 && <p className="overview-empty">{!view.known ? "Dados não disponíveis. Aguardando cadastro de projetos, classificações estratégicas e vínculo com as iniciativas." : summary.count === null ? "Classificações não informadas. Ainda não é possível determinar os projetos associados." : "Nenhum projeto associado nesta seleção."}</p>}
    {summary.projects.map(project => <article key={project.id} className="overview-detail-record"><div className="overview-record-meta">{project.id} · {project.unit ? `Unidade ${project.unit}` : "Unidade não informada"}</div><h3>{project.name || "Nome não informado"}</h3><p>{project.area || "Área não informada"} · {project.owner || "Responsável não informado"}</p><dl><div><dt>Pilares</dt><dd>{labels(project.pillarIds, view.config.pillars)}</dd></div><div><dt>Classificação estratégica</dt><dd>{labels(project.categoryIds, view.config.drivers.flatMap(driver => driver.categories))}</dd></div><div><dt>Tipo</dt><dd>{projectType(project.type)}</dd></div><div><dt>Priorizado</dt><dd>{project.prioritized === null ? "Não informado" : project.prioritized ? "Sim" : "Não"}</dd></div><div><dt>Status</dt><dd>{project.status || "Não informado"}</dd></div><div><dt>Benefício realizado</dt><dd>{money(project.realized)}</dd></div><div><dt>Forecast</dt><dd>{money(project.forecast)}</dd></div><div><dt>Iniciativas vinculadas</dt><dd>{project.initiativeIds === null ? "Vínculo não informado" : project.initiativeIds.length ? [...new Set(project.initiativeIds)].join(", ") : "Nenhuma vinculada"}</dd></div></dl></article>)}
  </div>;
}
