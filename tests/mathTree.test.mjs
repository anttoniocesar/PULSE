import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const dataUrl = url(compile(await readFile(new URL("../src/data/mathTreeTrefilarias.ts", import.meta.url), "utf8")));
const data = await import(dataUrl);
const calculationSource = compile(await readFile(new URL("../src/utils/mathTreeCalculations.ts", import.meta.url), "utf8"));
const calc = await import(url(calculationSource.replace('"../data/mathTreeTrefilarias"', JSON.stringify(dataUrl))));

test("The requested hierarchy contains eight costs and four production inputs, with an explicit unvalidated source", () => {
  assert.equal(data.costComponents.length, 8);
  assert.deepEqual(data.costComponents.filter(node => node.parentId === "direct").map(node => node.id), ["administration", "operating", "gendt"]);
  assert.deepEqual(data.costComponents.filter(node => node.parentId === "indirect").map(node => node.id), ["corporate", "allocations"]);
  assert.equal(data.productionInputs.length, 4);
  assert.equal(data.mathTreeSource.status, "pending-validation");
  for (const node of data.costComponents) {
    assert.deepEqual(node.rows.map(row => row.unit), ["JF", "SP", "Sa", "Re"]);
    assert.ok(node.rows.every(row => row.scenario === "MRF04"));
    assert.equal(node.allocationBasis, "not-confirmed");
  }
});
test("Financial deviations use MRF minus BDG, with favorable cost reductions and guarded missing/zero inputs", () => {
  assert.deepEqual(calc.calculateVariance(100, 90), { absolute: -10, percent: (90 / 100 - 1) * 100, favorable: "favorable" });
  assert.equal(calc.calculateVariance(100, 110).favorable, "unfavorable");
  assert.equal(calc.calculateVariance(100, 100).favorable, "neutral");
  assert.equal(calc.calculateVariance(0, 100).percent, null);
  assert.equal(calc.calculateVariance(null, 100).absolute, null);
  assert.equal(calc.calculateVariance(100, null).percent, null);
  assert.equal(calc.formatMathNumber(null), "—");
});

test("Unit cost comparisons classify the smaller and larger reference values, with neutral ties or unavailable values", () => {
  assert.deepEqual(calc.compareUnitCosts(422, 333), { budget: "higher", forecast: "lower" });
  assert.deepEqual(calc.compareUnitCosts(88, 68), { budget: "higher", forecast: "lower" });
  assert.deepEqual(calc.compareUnitCosts(400, 593), { budget: "lower", forecast: "higher" });
  assert.deepEqual(calc.compareUnitCosts(38.47, 46.94), { budget: "lower", forecast: "higher" });
  assert.deepEqual(calc.compareUnitCosts(0, 1), { budget: "lower", forecast: "higher" });
  for (const values of [[42, 42], [0, 0], [null, 10], [10, null], [null, null], [NaN, 10], [10, Infinity]]) {
    assert.deepEqual(calc.compareUnitCosts(...values), { budget: "neutral", forecast: "neutral" });
  }
});
for (const unit of ["all", "JF", "SP", "Sa", "Re"]) {
  test(`${unit}: node totals and ranked deviations use the selected reference rows without duplicate subtotals`, () => {
    for (const node of data.costComponents) {
      const selected = node.rows.filter(row => unit === "all" || row.unit === unit);
      const totals = calc.componentTotals(node, unit);
      assert.equal(totals.budget, selected.reduce((sum, row) => sum + row.budget.absolute, 0));
      assert.equal(totals.forecast, selected.reduce((sum, row) => sum + row.forecast.absolute, 0));
      assert.equal(totals.absolute, totals.forecast - totals.budget);
      assert.equal(totals.percent, (totals.forecast / totals.budget - 1) * 100);
    }
    const ranked = calc.largestVariances(unit);
    assert.equal(ranked.length, 5);
    assert.ok(ranked.every(item => !data.costComponents.some(node => node.parentId === item.component.id)));
    assert.ok(ranked.every((item, index) => index === 0 || Math.abs(ranked[index - 1].absolute) >= Math.abs(item.absolute)));
  });
}
test("The original unit value is preserved even when the indicative production ratio differs", () => {
  const row = data.costComponents.find(node => node.id === "total").rows[0];
  assert.equal(row.budget.referenceUnitCost, 610);
  const diagnostic = calc.unitCostDiagnostic(row, "budget");
  assert.equal(diagnostic.reference, 610);
  assert.equal(diagnostic.indicative, 103003146 / 201961);
  assert.equal(diagnostic.differs, true);
  assert.equal(row.budget.referenceUnitCost, 610);
});
test("Direct costs and one-real total mismatches remain flagged, without overwriting the reference", () => {
  const direct = data.costComponents.find(node => node.id === "direct");
  assert.equal(calc.reconciliationIssues(direct, "all").length, 8);
  const root = data.costComponents.find(node => node.id === "total");
  assert.ok(calc.reconciliationIssues(root, "SP").some(issue => issue.scenario === "forecast" && issue.difference === 1));
  assert.ok(calc.reconciliationIssues(root, "Sa").some(issue => issue.scenario === "budget" && issue.difference === -1));
  assert.equal(root.rows[1].forecast.absolute, 54173834);
});
test("Expansion is independent and hidden descendants retain their own state", () => {
  const all = calc.buildTreeLayout(new Set(), "all");
  assert.equal(all.visible.size, 8);
  const directClosed = calc.buildTreeLayout(new Set(["direct"]), "all");
  assert.ok(!directClosed.visible.has("operating"));
  assert.ok(directClosed.visible.has("corporate"));
  const rootClosed = calc.buildTreeLayout(new Set(["total", "indirect"]), "all");
  assert.deepEqual([...rootClosed.visible], ["total"]);
  const rootReopened = calc.buildTreeLayout(new Set(["indirect"]), "all");
  assert.ok(rootReopened.visible.has("operating"));
  assert.ok(!rootReopened.visible.has("corporate"));
  assert.deepEqual([...calc.buildTreeLayout(new Set(["direct", "indirect"]), "all").visible], ["total", "direct", "indirect"]);
});
test("Layouts preserve spacing and finite coordinates for every collapse combination and unit scope", () => {
  for (const unit of ["all", "JF"]) for (let mask = 0; mask < 8; mask++) {
    const collapsed = new Set(["total", "direct", "indirect"].filter((_, index) => mask & (1 << index)));
    const layout = calc.buildTreeLayout(collapsed, unit);
    const positions = [...layout.positions.entries()];
    for (const [, position] of positions) assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y) && position.y >= 0);
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      const [, a] = positions[i], [, b] = positions[j];
      if (a.x === b.x) assert.ok(Math.abs(a.y - b.y) >= layout.nodeHeight, "Nodes in the same column must not overlap");
    }
  }
});
