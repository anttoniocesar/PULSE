import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { applyNodeChanges, Background, BackgroundVariant, MarkerType, Panel, ReactFlow, useNodesInitialized, useNodesState, useReactFlow, useViewport, type Edge, type NodeChange, type NodeTypes, type Viewport } from "@xyflow/react";
import { Maximize, Minus, Plus, Scan } from "lucide-react";
import { costComponents, type CostNodeId, type MathNodeId, type MathTreeUnit } from "../../data/mathTreeTrefilarias";
import { buildTreeLayout } from "../../utils/mathTreeCalculations";
import CostNode, { type CostFlowNode } from "./CostNode";
import ProductionNode, { type ProductionFlowNode } from "./ProductionNode";
import BranchControlNode, { BranchControlEdge, type BranchFlowNode } from "./BranchControlNode";
import { branchControlId, buildBranchControlLayout, getTreeBranchFitPadding, getTreeBranchPoint, TREE_BRANCH_CONTROL_SIZE, TREE_BRANCH_OFFSET } from "../../utils/treeBranchGeometry";

const nodeTypes: NodeTypes = { cost: CostNode, production: ProductionNode, branchControl: BranchControlNode };
const edgeTypes = { branch: BranchControlEdge };
type TreeFlowNode = CostFlowNode | ProductionFlowNode | BranchFlowNode;
type Props = {
  unit: MathTreeUnit; collapsed: ReadonlySet<CostNodeId>; viewRevision: number;
  onToggle: (id: CostNodeId) => void; onDetails: (id: MathNodeId) => void;
  onFullscreen: () => void; fullscreen: boolean;
  restoredViewport?: Viewport | null;
};

function CanvasControls({ onFullscreen, fullscreen, fitPadding }: Pick<Props, "onFullscreen" | "fullscreen"> & { fitPadding: number }) {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();
  return <Panel position="bottom-left" className="math-canvas-controls"><div>
    <button onClick={() => void zoomOut()} aria-label="Diminuir zoom"><Minus size={16} /></button>
    <button className="math-zoom-value" onClick={() => void zoomTo(1)} aria-label="Restaurar zoom para 100%" title="Ler tabelas em escala natural">{Math.round(zoom * 100)}%</button>
    <button onClick={() => void zoomIn()} aria-label="Aumentar zoom"><Plus size={16} /></button>
  </div><button className="math-canvas-control" onClick={() => void fitView({ padding: fitPadding, duration: 0 })} aria-label="Ajustar árvore à tela" title="Ajustar à tela"><Maximize size={16} /></button><button className="math-canvas-control" onClick={onFullscreen} disabled={!document.fullscreenEnabled} aria-label={fullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"} title={document.fullscreenEnabled ? "Tela cheia" : "Tela cheia indisponível neste navegador"}><Scan size={16} /></button></Panel>;
}

function FitAfterLayout({ revision, canvasRef, restoredViewport, fitPadding }: { revision: string; canvasRef: RefObject<HTMLDivElement | null>; restoredViewport?: Viewport | null; fitPadding: number }) {
  const restored = useRef(false);
  const initialized = useNodesInitialized();
  const { fitView, getNode, setCenter, setViewport, viewportInitialized } = useReactFlow();
  useEffect(() => {
    if (!initialized || !viewportInitialized) return;
    const frame = requestAnimationFrame(() => {
      if (!restored.current && restoredViewport) { restored.current = true; void setViewport(restoredViewport); return; }
      restored.current = true;
      const width = canvasRef.current?.clientWidth ?? 0;
      const root = getNode("total");
      if (width > 0 && width < 600 && root) {
        // Include the junction beyond the root card so its control stays reachable on small screens.
        const worldWidth = (root.measured?.width ?? 360) + TREE_BRANCH_OFFSET;
        const zoom = Math.max(0.2, Math.min(1, (width - 12 - TREE_BRANCH_CONTROL_SIZE / 2) / worldWidth));
        const focusWidth = worldWidth + TREE_BRANCH_CONTROL_SIZE / 2 / zoom;
        void setCenter(root.position.x + focusWidth / 2, root.position.y + (root.measured?.height ?? 156) / 2, { zoom, duration: 0 });
      } else void fitView({ padding: fitPadding, duration: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialized, viewportInitialized, revision, fitView, getNode, setCenter, setViewport, canvasRef, restoredViewport, fitPadding]);
  return null;
}

export default function MathTreeCanvas({ unit, collapsed, viewRevision, onToggle, onDetails, onFullscreen, fullscreen, restoredViewport }: Props) {
  const tree = useMemo(() => buildBranchControlLayout(buildTreeLayout(collapsed, unit)), [collapsed, unit]);
  const fitPadding = getTreeBranchFitPadding();
  const canvasRef = useRef<HTMLDivElement>(null);
  const derivedNodes = useMemo<TreeFlowNode[]>(() => [
    { id: "production", type: "production", position: tree.positions.get("production")!, data: { unit, onDetails: () => onDetails("production") }, style: { width: 360 }, focusable: false, ariaLabel: "Produção em toneladas" },
    ...costComponents.filter(component => tree.visible.has(component.id)).map(component => ({
      id: component.id, type: "cost" as const, position: tree.positions.get(component.id)!,
      data: { component, unit, expanded: !collapsed.has(component.id), onToggle, onDetails },
      style: { width: 360 }, focusable: false, ariaLabel: component.name,
    })),
    ...tree.controls.map(control => ({
      id: control.id, type: "branchControl" as const, position: control.position,
      data: { parentId: control.parentId, label: control.label, expanded: !collapsed.has(control.parentId), onToggle },
      style: { width: TREE_BRANCH_CONTROL_SIZE, height: TREE_BRANCH_CONTROL_SIZE }, zIndex: 20,
      draggable: false, selectable: false, focusable: false, ariaLabel: control.label,
    })),
  ], [tree, unit, collapsed, onToggle, onDetails]);
  const [nodes, setNodes] = useNodesState<TreeFlowNode>([]);
  const onNodesChange = useCallback((changes: NodeChange<TreeFlowNode>[]) => {
    setNodes(current => {
      const next = applyNodeChanges(changes, current);
      // Measured heights also center controls on filtered, single-unit cards.
      return next.map(node => {
        if (node.type !== "branchControl") return node;
        const parent = next.find(item => item.id === node.data.parentId);
        if (!parent) return node;
        const point = getTreeBranchPoint(parent.position.x + (parent.measured?.width ?? 360), parent.position.y + (parent.measured?.height ?? tree.nodeHeight) / 2);
        const position = { x: point.x - TREE_BRANCH_CONTROL_SIZE / 2, y: point.y - TREE_BRANCH_CONTROL_SIZE / 2 };
        return position.x === node.position.x && position.y === node.position.y ? node : { ...node, position };
      });
    });
  }, [setNodes, tree.nodeHeight]);
  useEffect(() => { setNodes(derivedNodes); }, [derivedNodes, setNodes]);
  const edges = useMemo<Edge[]>(() => [
    { id: "production-total", source: "production", sourceHandle: "production", target: "total", targetHandle: "production", type: "straight", style: { stroke: "#b6c9d6", strokeWidth: 1.3, strokeDasharray: "4 4" }, focusable: false },
    ...tree.controls.map(control => ({ id: `${control.parentId}-branch`, source: control.parentId, sourceHandle: "children", target: control.id, targetHandle: "input", type: "straight", style: { stroke: "#3299e2", strokeWidth: 2.4 }, focusable: false })),
    ...costComponents.filter(component => component.parentId && tree.visible.has(component.id) && tree.visible.has(component.parentId)).map(component => {
      const color = component.id === "operating" || component.id === "gendt" ? "#3dc4aa" : "#3299e2";
      return { id: `${branchControlId(component.parentId!)}-${component.id}`, source: branchControlId(component.parentId!), sourceHandle: "output", target: component.id, targetHandle: "parent", type: "branch", style: { stroke: color, strokeWidth: 2.4 }, markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 }, focusable: false };
    }),
  ], [tree]);
  const revision = `${unit}:${[...collapsed].sort().join(",")}:${viewRevision}`;
  return <div ref={canvasRef} className={`math-canvas${unit !== "all" ? " math-canvas--single" : ""}`} aria-label="Árvore matemática de custos interativa">
    <ReactFlow nodes={nodes} onNodesChange={onNodesChange} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} edgesFocusable={false} minZoom={0.2} maxZoom={2} panOnDrag zoomOnScroll zoomOnPinch preventScrolling zoomOnDoubleClick={false} deleteKeyCode={null} colorMode="light" aria-label="Árvore de custos. Arraste para mover e use a roda do mouse ou os controles para ampliar.">
      <Background variant={BackgroundVariant.Dots} gap={24} size={0.7} color="#d8e5ed" />
      <FitAfterLayout revision={revision} canvasRef={canvasRef} restoredViewport={restoredViewport} fitPadding={fitPadding} />
      <CanvasControls onFullscreen={onFullscreen} fullscreen={fullscreen} fitPadding={fitPadding} />
    </ReactFlow>
  </div>;
}

