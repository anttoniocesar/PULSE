import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, ChevronRight, Expand, FoldVertical, Info, Maximize, Truck } from "lucide-react";
import LogisticsTreeCanvas, { type LogisticsViewState } from "../components/math-tree/LogisticsTreeCanvas";
import { logisticsGlossary, logisticsHierarchy, logisticsUnitLabel, logisticsUnits, type LogisticsContext, type LogisticsNodeId } from "../data/logisticsTree";
import type { MathTreeUnit } from "../data/mathTreeTrefilarias";
import "../styles/logistics-tree.css";

type Props = {
  unit: MathTreeUnit; scenario: "MRF04"; period: string | null; onUnit: (unit: MathTreeUnit) => void; onBack: () => void;
  state: LogisticsViewState; onState: Dispatch<SetStateAction<LogisticsViewState>>;
};

export default function LogisticsTreePage({ unit, scenario, period, onUnit, onBack, state, onState }: Props) {
  const context = useMemo<LogisticsContext>(() => ({ unit, scenario, period }), [unit, scenario, period]);
  const [fitRevision, setFitRevision] = useState(0);
  const toggle = useCallback((id: LogisticsNodeId) => onState(previous => {
    const collapsed = new Set(previous.collapsed);
    if (logisticsHierarchy.some(child => child.parentId === id)) {
      const expandedBranches = new Set(previous.expandedBranches);
      if (expandedBranches.has(id)) expandedBranches.delete(id); else expandedBranches.add(id);
      collapsed.delete(id);
      return { ...previous, collapsed, expandedBranches };
    }
    if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
    return { ...previous, collapsed };
  }), [onState]);
  const allocation = useCallback((id: LogisticsNodeId, open: boolean) => onState(previous => {
    const allocationOpen = new Set(previous.allocationOpen); if (open) allocationOpen.add(id); else allocationOpen.delete(id);
    return { ...previous, allocationOpen };
  }), [onState]);
  return <section className="logistics-page">
    <div className="logistics-navigation"><nav aria-label="Navegação da composição"><button onClick={onBack}>Math Tree</button><ChevronRight size={12} /><button onClick={onBack}>Custos Administrativos</button><ChevronRight size={12} /><span aria-current="page">Logística</span></nav><button className="math-action" onClick={onBack}><ArrowLeft size={14} />Voltar à árvore principal</button></div>
    <div className="math-page-heading"><span><Truck size={25} strokeWidth={1.7} /></span><div><h1>Logística</h1><p>Custos Administrativos · Trefilarias · BDG vs {scenario}</p></div></div>
    <div className="logistics-context"><label className="math-select"><span>Unidade operacional</span><select aria-label="Unidade operacional" value={unit} onChange={event => onUnit(event.target.value as MathTreeUnit)}><option value="all">Todas as unidades</option>{logisticsUnits.map(item => <option key={item.sourceCode} value={item.sourceCode}>{item.code} — {item.name}{item.pendingRegistration ? " (cadastro a validar)" : ""}</option>)}</select></label><span>{scenario}</span><span>{period ? `Período: ${period}` : "Período da origem não informado"}</span><span className="logistics-selection" role="status">{logisticsUnitLabel(unit)}</span></div>
    <div className="logistics-data-note"><Info size={15} /><p>O total utiliza a referência disponível. A composição por ramificação e os rateios não foram fornecidos; “—” significa dado não informado, não custo zero.{period && " Não há dados cadastrados para o período selecionado."}</p></div>
    <div className="logistics-toolbar"><div className="logistics-glossary" aria-label="Significado dos indicadores">{[["BDG", logisticsGlossary.BDG], ["MRF", logisticsGlossary.MRF], ["R$/t", logisticsGlossary.unit]].map(([label, description]) => <span className="logistics-term" key={label} tabIndex={0} aria-label={`${label}: ${description}`} data-tooltip={description}>{label}<Info size={11} aria-hidden="true" /></span>)}</div><div className="math-toolbar__actions"><button className="math-action" onClick={() => onState(previous => ({ ...previous, collapsed: new Set(), expandedBranches: new Set(logisticsHierarchy.filter(item => item.id !== "logistics" && logisticsHierarchy.some(child => child.parentId === item.id)).map(item => item.id)) }))}><Expand size={14} />Expandir tudo</button><button className="math-action" onClick={() => onState(previous => ({ ...previous, collapsed: new Set(logisticsHierarchy.filter(item => item.parentId === "logistics").map(item => item.id)), expandedBranches: new Set() }))}><FoldVertical size={14} />Recolher tudo</button><button className="math-action" onClick={() => setFitRevision(value => value + 1)}><Maximize size={14} />Ajustar à tela</button></div></div>
    <ReactFlowProvider><LogisticsTreeCanvas context={context} state={state} onState={onState} onToggle={toggle} onAllocation={allocation} fitRevision={fitRevision} /></ReactFlowProvider>
    <footer className="logistics-footer"><span>Arraste para explorar · + / − para ampliar · setas nos cards para abrir as unidades</span><span>SB corresponde ao código Sa da origem. Descrições de SP e Re pendentes de validação cadastral.</span></footer>
  </section>;
}
