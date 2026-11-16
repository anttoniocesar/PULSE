import { useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { Background, BackgroundVariant, MarkerType, Panel, ReactFlow, useNodesInitialized, useNodesState, useReactFlow, useViewport, type Edge, type Viewport } from "@xyflow/react";
import { Maximize, Minus, Plus } from "lucide-react";
import { logisticsHierarchy, type LogisticsContext, type LogisticsNodeId } from "../../data/logisticsTree";
import { getLogisticsLayout } from "../../utils/logisticsCalculations";
import LogisticsCostNode, { type LogisticsFlowNode } from "./LogisticsCostNode";

export type LogisticsViewState = { collapsed: Set<LogisticsNodeId>; expandedBranches: Set<LogisticsNodeId>; allocationOpen: Set<LogisticsNodeId>; viewport: Viewport | null };
export const createLogisticsViewState = (): LogisticsViewState => ({ collapsed: new Set(), expandedBranches: new Set(), allocationOpen: new Set(), viewport: null });
const nodeTypes = { logistics: LogisticsCostNode };

function LogisticsFit({ revision, initialViewport, canvasWidth }: { revision: string; initialViewport: Viewport | null; canvasWidth: () => number }) {
  const initialized = useNodesInitialized();
  const { viewportInitialized, fitView, setViewport, setCenter, getNode } = useReactFlow();
  const restored = useRef(false);
  useEffect(() => {
    if (!initialized || !viewportInitialized) return;
    const frame = requestAnimationFrame(() => {
      if (!restored.current && initialViewport) { restored.current = true; void setViewport(initialViewport); return; }
      const initialView = !restored.current;
      restored.current = true;
      const width = canvasWidth(), root = getNode("logistics");
      if (initialView && root && width < 600) void setCenter(root.position.x + 235, root.position.y + (root.measured?.height ?? 230) / 2, { zoom: Math.max(0.62, Math.min(1, (width - 12) / 470)) });
      else void fitView({ padding: 0.08, duration: 0 });
    });
    return () => cancelAnimationFrame(frame);
    // The persisted viewport is an entry snapshot, not a signal to refit while panning.
  }, [initialized, viewportInitialized, revision, fitView, setViewport, setCenter, getNode, canvasWidth, initialViewport]);
  return null;
}

export default function LogisticsTreeCanvas({ context, state, onState, onToggle, onAllocation, fitRevision }: {
  context: LogisticsContext; state: LogisticsViewState; onState: Dispatch<SetStateAction<LogisticsViewState>>;
  onToggle: (id: LogisticsNodeId) => void; onAllocation: (id: LogisticsNodeId, open: boolean) => void; fitRevision: number;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const initialViewport = useRef(state.viewport);
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const layout = useMemo(() => getLogisticsLayout(state.collapsed, state.allocationOpen, context, state.expandedBranches), [state.collapsed, state.allocationOpen, state.expandedBranches, context]);
  const derivedNodes = useMemo<LogisticsFlowNode[]>(() => logisticsHierarchy.filter(component => layout.visible.has(component.id)).map(component => ({
    id: component.id, type: "logistics", position: layout.positions.get(component.id)!, style: { width: 470 }, focusable: false,
    data: { id: component.id, context, expanded: component.id !== "logistics" && logisticsHierarchy.some(child => child.parentId === component.id) ? state.expandedBranches.has(component.id) : !state.collapsed.has(component.id), detailsExpanded: !state.collapsed.has(component.id), allocationOpen: state.allocationOpen.has(component.id), onToggle, onAllocation },
  })), [layout, context, state.collapsed, state.expandedBranches, state.allocationOpen, onToggle, onAllocation]);
  const [nodes, setNodes, onNodesChange] = useNodesState<LogisticsFlowNode>([]);
  useEffect(() => { setNodes(derivedNodes); }, [derivedNodes, setNodes]);
  const edges = useMemo<Edge[]>(() => logisticsHierarchy.filter(component => component.parentId && layout.visible.has(component.id) && layout.visible.has(component.parentId)).map(component => ({
    id: `${component.parentId}-${component.id}`, source: component.parentId!, target: component.id, type: "smoothstep", pathOptions: { borderRadius: 22 },
    style: { stroke: "#3299e2", strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#3299e2", width: 16, height: 16 }, focusable: false,
  })), [layout]);
  const revision = `${context.unit}:${context.scenario}:${context.period}:${[...state.collapsed].sort()}:${[...state.expandedBranches].sort()}:${[...state.allocationOpen].sort()}:${fitRevision}`;
  const canvasWidth = useRef(() => frame.current?.clientWidth ?? 1000).current;
  return <div ref={frame} className="logistics-canvas" aria-label="Árvore de composição de Logística">
    <ReactFlow nodes={nodes} onNodesChange={onNodesChange} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} edgesFocusable={false} minZoom={0.1} maxZoom={2} panOnDrag zoomOnScroll zoomOnPinch zoomOnDoubleClick={false} deleteKeyCode={null} onMoveEnd={(_, viewport) => onState(previous => ({ ...previous, viewport }))}>
      <Background variant={BackgroundVariant.Dots} color="#d8e5ed" gap={24} size={0.7} />
      <LogisticsFit revision={revision} initialViewport={initialViewport.current} canvasWidth={canvasWidth} />
      <Panel position="bottom-left" className="math-canvas-controls"><div><button onClick={() => void zoomOut()} aria-label="Diminuir zoom"><Minus size={16} /></button><button className="math-zoom-value" onClick={() => void zoomTo(1)} aria-label="Restaurar zoom para 100%">{Math.round(zoom * 100)}%</button><button onClick={() => void zoomIn()} aria-label="Aumentar zoom"><Plus size={16} /></button></div><button className="math-canvas-control" onClick={() => void fitView({ padding: 0.08 })} aria-label="Ajustar composição à tela"><Maximize size={16} /></button></Panel>
    </ReactFlow>
  </div>;
}
