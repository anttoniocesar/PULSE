import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { getViewportForBounds } from "@xyflow/system";

async function moduleUrl(file, replacements = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  for (const [from, to] of Object.entries(replacements)) outputText = outputText.replaceAll(`"${from}"`, JSON.stringify(to));
  return "data:text/javascript;base64," + Buffer.from(outputText).toString("base64");
}
const dataUrl = await moduleUrl("../src/data/mathTreeTrefilarias.ts");
const data = await import(dataUrl);
const calc = await import(await moduleUrl("../src/utils/mathTreeCalculations.ts", { "../data/mathTreeTrefilarias": dataUrl }));
const geometry = await import(await moduleUrl("../src/utils/treeBranchGeometry.ts", { "../data/mathTreeTrefilarias": dataUrl }));
const parents = data.costComponents.filter(parent => data.costComponents.some(child => child.parentId === parent.id));

test("Real controls have unique IDs and parents for every visible branch in every collapse/filter state", () => {
  for (const unit of ["all", "JF", "SP", "Sa", "Re"]) for (let mask = 0; mask < 8; mask++) {
    const collapsed = new Set(parents.filter((_, index) => mask & (1 << index)).map(parent => parent.id));
    const before = [...collapsed], base = calc.buildTreeLayout(collapsed, unit), tree = geometry.buildBranchControlLayout(base);
    assert.deepEqual(tree.visible, base.visible);
    assert.equal(new Set(tree.controls.map(control => control.id)).size, tree.controls.length);
    assert.deepEqual(tree.controls.map(control => control.parentId), parents.filter(parent => base.visible.has(parent.id)).map(parent => parent.id));
    assert.deepEqual([...collapsed], before);
    for (const [id, point] of tree.positions) assert.equal(point.y, base.positions.get(id).y, "Vertical card layout must stay unchanged");
    for (const control of tree.controls) assert.equal(control.id, geometry.branchControlId(control.parentId));
  }
});

test("Controls and their visible button extents fit between fixed-size cost cards at 40%, 80% and 120%", () => {
  const tree = geometry.buildBranchControlLayout(calc.buildTreeLayout(new Set(), "all"));
  assert.equal(geometry.TREE_CARD_WIDTH, 360);
  for (const control of tree.controls) for (const zoom of [0.4, 0.8, 1.2]) {
    const parent = tree.positions.get(control.parentId);
    const centerX = control.position.x + geometry.TREE_BRANCH_CONTROL_SIZE / 2;
    const visualHalf = geometry.TREE_BRANCH_CONTROL_SIZE * geometry.getBranchControlScale(zoom) / 2;
    assert.ok(centerX - visualHalf > parent.x + 360);
    assert.ok(centerX + visualHalf < parent.x + 360 + geometry.TREE_BRANCH_GAP);
    assert.equal(control.position.y + 13, parent.y + tree.nodeHeight / 2);
    assert.ok(Math.abs(geometry.TREE_BRANCH_CONTROL_SIZE * geometry.getBranchControlScale(zoom) * zoom - 26) < 1e-9);
  }
});

test("At minimum zoom the visual size is capped to avoid covering a card", () => {
  assert.ok(geometry.TREE_BRANCH_CONTROL_SIZE * geometry.getBranchControlScale(0.2) < geometry.TREE_BRANCH_GAP);
});

test("Child edges start at the real control node center, with no old card offset applied", () => {
  const tree = geometry.buildBranchControlLayout(calc.buildTreeLayout(new Set(), "all"));
  for (const control of tree.controls) {
    const sourceX = control.position.x + 13, sourceY = control.position.y + 13;
    for (const child of data.costComponents.filter(child => child.parentId === control.parentId)) {
      const target = tree.positions.get(child.id), targetY = target.y + tree.nodeHeight / 2;
      const path = geometry.getTreeBranchPath(sourceX, sourceY, target.x, targetY);
      assert.ok(path.startsWith(`M ${sourceX},${sourceY}`));
      assert.ok(path.endsWith(`L ${target.x},${targetY}`));
      assert.doesNotMatch(path, /NaN|Infinity/);
    }
  }
});

test("Collapsed root retains its own real control node while descendant controls disappear", () => {
  const tree = geometry.buildBranchControlLayout(calc.buildTreeLayout(new Set(["total", "direct"]), "all"));
  assert.deepEqual(tree.controls.map(control => control.parentId), ["total"]);
  assert.deepEqual([...tree.visible], ["total"]);
});

test("Fitting includes the real control bounds on narrow canvases", () => {
  const tree = geometry.buildBranchControlLayout(calc.buildTreeLayout(new Set(["total"]), "all"));
  const control = tree.controls[0], centerX = control.position.x + 13;
  const bounds = { x: 20, y: 18, width: control.position.x + 26 - 20, height: 367 };
  for (const width of [276, 346, 704, 1276]) {
    const viewport = getViewportForBounds(bounds, width, 560, 0.2, 2, geometry.getTreeBranchFitPadding());
    const physicalHalf = 13 * geometry.getBranchControlScale(viewport.zoom) * viewport.zoom;
    assert.ok(centerX * viewport.zoom + viewport.x + physicalHalf <= width);
    assert.ok(bounds.x * viewport.zoom + viewport.x >= 0);
  }
});
