import { BaseEdge, Handle, Position, useViewport, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import type { CostNodeId } from "../../data/mathTreeTrefilarias";
import { getBranchControlScale, getTreeBranchPath } from "../../utils/treeBranchGeometry";
import ExpandCollapseButton from "./ExpandCollapseButton";

export type BranchFlowNode = Node<{
  parentId: CostNodeId; label: string; expanded: boolean; onToggle: (id: CostNodeId) => void;
}, "branchControl">;
const center = { top: "50%", left: "50%", right: "auto", width: 0, height: 0, transform: "translate(-50%, -50%)" };

export default function BranchControlNode({ data }: NodeProps<BranchFlowNode>) {
  const { zoom } = useViewport();
  return <div className="math-branch-control-node" data-branch-id={data.parentId}>
    <Handle id="input" type="target" position={Position.Left} style={center} isConnectable={false} />
    <div className="math-branch-button-scale" style={{ transform: `scale(${getBranchControlScale(zoom)})` }}>
      <ExpandCollapseButton label={data.label} expanded={data.expanded} onClick={() => data.onToggle(data.parentId)} />
    </div>
    <Handle id="output" type="source" position={Position.Right} style={center} isConnectable={false} />
  </div>;
}

export function BranchControlEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, interactionWidth }: EdgeProps) {
  return <BaseEdge id={id} path={getTreeBranchPath(sourceX, sourceY, targetX, targetY)} markerEnd={markerEnd} style={style} interactionWidth={interactionWidth} />;
}
