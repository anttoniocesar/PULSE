import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider, useReactFlow, type Viewport } from "@xyflow/react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, CircleAlert, Layers3, PanelRightOpen } from "lucide-react";
import MathTreeCanvas from "../components/math-tree/MathTreeCanvas";
import MathTreeToolbar from "../components/math-tree/MathTreeToolbar";
import VariancePanel from "../components/math-tree/VariancePanel";
import CostDetailDrawer from "../components/math-tree/CostDetailDrawer";
import { type CostNodeId, type MathNodeId, type MathTreeUnit } from "../data/mathTreeTrefilarias";
import { normalizeMathUnit } from "../data/logisticsTree";
import { createLogisticsViewState } from "../components/math-tree/LogisticsTreeCanvas";
import LogisticsTreePage from "./LogisticsTreePage";
import { usePlatformBack } from "../hooks/usePlatformBack";
import { getTreeBranchFitPadding } from "../utils/treeBranchGeometry";
import "@xyflow/react/dist/style.css";
import "../styles/math-tree.css";

type WorkspaceSnapshot = {
  unit: MathTreeUnit;
  collapsed: Set<CostNodeId>;
  panelOpen: boolean;
  status: string;
  logisticsState: ReturnType<typeof createLogisticsViewState>;
  viewport: Viewport | null;
  scroll: number;
};
// Keep the analysis for return visits within this app session, without persisting financial data.
let savedWorkspace: WorkspaceSnapshot | null = null;

function MathTreeWorkspace() {
  const initial = useRef(savedWorkspace);
  const goBack = usePlatformBack();
  const [searchParams, setSearchParams] = useSearchParams();
  const [unit, setUnit] = useState<MathTreeUnit>(() => normalizeMathUnit(searchParams.get("unit") ?? initial.current?.unit ?? null));
  const [collapsed, setCollapsed] = useState<Set<CostNodeId>>(() => new Set(initial.current?.collapsed));
  const [selected, setSelected] = useState<MathNodeId | null>(null);
  const [panelOpen, setPanelOpen] = useState(initial.current?.panelOpen ?? true);
  const [viewRevision, setViewRevision] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState(initial.current?.status ?? "Todos os ramos expandidos.");
  const [logisticsState, setLogisticsState] = useState(() => initial.current?.logisticsState ?? createLogisticsViewState());
  const parentViewport = useRef<Viewport | null>(initial.current?.viewport ?? null);
  const parentScroll = useRef(initial.current?.scroll ?? 0);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { fitView, getViewport } = useReactFlow();
  const logisticsOpen = searchParams.get("view") === "logistics";
  const queryUnit = searchParams.get("unit");
  useEffect(() => { setUnit(normalizeMathUnit(queryUnit ?? initial.current?.unit ?? null)); }, [queryUnit]);
  const latest = useRef({ unit, collapsed, panelOpen, status, logisticsState, logisticsOpen });
  useEffect(() => { latest.current = { unit, collapsed, panelOpen, status, logisticsState, logisticsOpen }; });
  useEffect(() => () => {
    const { logisticsOpen: inLogistics, ...analysis } = latest.current;
    savedWorkspace = {
      ...analysis,
      viewport: inLogistics ? parentViewport.current : getViewport(),
      scroll: inLogistics ? parentScroll.current : document.getElementById("dashboard-content")?.scrollTop ?? 0,
    };
  }, [getViewport]);
  useEffect(() => {
    const content = document.getElementById("dashboard-content");
    content?.scrollTo({ top: logisticsOpen ? 0 : parentScroll.current });
  }, [logisticsOpen]);
  function changeUnit(value: MathTreeUnit) {
    setUnit(value);
    const next = new URLSearchParams(searchParams); next.set("unit", value);
    setSearchParams(next, { replace: true });
    setStatus(`Unidade: ${value === "all" ? "Todas as unidades" : value}.`);
  }
  const openComponent = useCallback((id: MathNodeId) => {
    if (id !== "administration") { setSelected(id); return; }
    parentViewport.current = getViewport();
    parentScroll.current = document.getElementById("dashboard-content")?.scrollTop ?? 0;
    const next = new URLSearchParams(searchParams);
    next.set("view", "logistics"); next.set("unit", unit); next.set("scenario", "MRF04");
    setSearchParams(next);
  }, [getViewport, searchParams, setSearchParams, unit]);
  function returnToMain() {
    const next = new URLSearchParams(searchParams); next.delete("view"); next.set("unit", unit);
    setSearchParams(next);
  }
  const toggle = useCallback((id: CostNodeId) => {
    setCollapsed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => { setFullscreen(document.fullscreenElement === workspaceRef.current); setViewRevision(value => value + 1); };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await workspaceRef.current?.requestFullscreen();
    } catch { setStatus("O navegador não permitiu tela cheia. Use zoom ou Ajustar à tela."); }
  }
  function changePanel(open: boolean) { setPanelOpen(open); setViewRevision(value => value + 1); }
  function refresh() {
    setCollapsed(new Set()); setSelected(null); setViewRevision(value => value + 1);
    setStatus(`MRF04 restaurado · ${unit === "all" ? "Todas as unidades" : unit}. Valores de referência mantidos.`);
  }
  if (logisticsOpen) return <LogisticsTreePage unit={unit} scenario="MRF04" period={searchParams.get("period")} onUnit={changeUnit} onBack={returnToMain} state={logisticsState} onState={setLogisticsState} />;
  return (
    <div className={parentViewport.current ? "math-tree-page math-tree-page--returning" : "math-tree-page"}>
      <div className="math-page-heading math-page-heading--with-back"><span><Layers3 size={26} strokeWidth={1.7} aria-hidden="true" /></span><div><h1>Math Tree Cost</h1><p>Trefilarias <span>·</span> BDG vs MRF04</p></div><button type="button" className="math-action math-page-back" onClick={goBack}><ArrowLeft size={14} aria-hidden="true" />Voltar</button></div>
      <MathTreeToolbar unit={unit} onUnit={changeUnit} onRefresh={refresh} onExpand={() => { setCollapsed(new Set()); setStatus("Todos os ramos expandidos."); }} onCollapse={() => { setCollapsed(new Set(["direct", "indirect"])); setStatus("Exibindo Produção, Custo Total, Custos Diretos e Custos Indiretos."); }} onFit={() => void fitView({ padding: getTreeBranchFitPadding(), duration: 0 })} />
      <div className="math-provenance"><CircleAlert size={14} aria-hidden="true" /><span>Dados da referência visual · validação com a árvore original pendente.</span><button onClick={() => setSelected("total")}>Ver observações</button></div>
      <p className="math-mobile-hint">Arraste a árvore para explorar · use + / − para ampliar.</p>
      <div ref={workspaceRef} className={`math-workspace${panelOpen ? "" : " math-workspace--wide"}`}>
        <div className="math-canvas-frame"><MathTreeCanvas unit={unit} collapsed={collapsed} viewRevision={viewRevision} onToggle={toggle} onDetails={openComponent} onFullscreen={() => void toggleFullscreen()} fullscreen={fullscreen} restoredViewport={parentViewport.current} />{!panelOpen && <button className="math-open-panel" onClick={() => changePanel(true)}><PanelRightOpen size={16} />Maiores Desvios</button>}</div>
        {panelOpen && <VariancePanel unit={unit} onClose={() => changePanel(false)} onDetails={openComponent} />}
        {selected && <CostDetailDrawer id={selected} unit={unit} onClose={() => setSelected(null)} />}
      </div>
      <div className="math-page-footer"><span>Arraste para mover · use + / − para ampliar · clique no título de um nó para detalhar</span><span role="status">{status}</span></div>
    </div>
  );
}

export default function MathTreeCostPage() {
  return <ReactFlowProvider><MathTreeWorkspace /></ReactFlowProvider>;
}
