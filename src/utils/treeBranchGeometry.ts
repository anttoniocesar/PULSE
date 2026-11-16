import { costComponents, type CostNodeId, type MathNodeId } from "../data/mathTreeTrefilarias";

export const TREE_CARD_WIDTH = 360;
export const TREE_BRANCH_GAP = 112;
export const TREE_BRANCH_OFFSET = TREE_BRANCH_GAP / 2;
export const TREE_BRANCH_CONTROL_SIZE = 26;
export const getTreeBranchFitPadding = () => 0.1;
export const branchControlId = (parentId: CostNodeId) => `branch-${parentId}`;

export function getBranchControlScale(zoom: number) {
  // 26 screen pixels at 40%, 80% and 120%. Below ~30%, cap the world size
  // so a control cannot cover a cost card in the same column gap.
  return Math.min(1 / Math.max(zoom, 0.01), (TREE_BRANCH_GAP - 24) / TREE_BRANCH_CONTROL_SIZE);
}

export function getTreeBranchPoint(sourceX: number, sourceY: number) {
  return { x: sourceX + TREE_BRANCH_OFFSET, y: sourceY };
}

type BaseLayout = { positions: Map<MathNodeId, { x: number; y: number }>; visible: Set<CostNodeId>; nodeHeight: number };
export function buildBranchControlLayout(base: BaseLayout) {
  const positions = new Map<MathNodeId, { x: number; y: number }>();
  const rootX = base.positions.get("total")!.x;
  const depth = (id: CostNodeId): number => {
    const parent = costComponents.find(component => component.id === id)?.parentId;
    return parent ? depth(parent) + 1 : 0;
  };
  for (const [id, position] of base.positions) {
    positions.set(id, { x: id === "production" ? rootX : rootX + depth(id) * (TREE_CARD_WIDTH + TREE_BRANCH_GAP), y: position.y });
  }
  const controls = costComponents.filter(component => base.visible.has(component.id) && costComponents.some(child => child.parentId === component.id)).map(component => {
    const parent = positions.get(component.id)!;
    const point = getTreeBranchPoint(parent.x + TREE_CARD_WIDTH, parent.y + base.nodeHeight / 2);
    return { id: branchControlId(component.id), parentId: component.id, label: component.name, position: { x: point.x - TREE_BRANCH_CONTROL_SIZE / 2, y: point.y - TREE_BRANCH_CONTROL_SIZE / 2 } };
  });
  return { ...base, positions, controls };
}

export function getTreeBranchPath(sourceX: number, sourceY: number, targetX: number, targetY: number) {
  // Source is the real control node center, not an offset from a cost card.
  if (sourceY === targetY) return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  const direction = Math.sign(targetY - sourceY);
  const radius = Math.min(24, Math.abs(targetY - sourceY) / 2, Math.max(0, targetX - sourceX) / 2);
  return `M ${sourceX},${sourceY} L ${sourceX},${targetY - direction * radius} Q ${sourceX},${targetY} ${sourceX + radius},${targetY} L ${targetX},${targetY}`;
}
