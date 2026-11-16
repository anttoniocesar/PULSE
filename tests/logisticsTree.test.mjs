import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const load = async (path, imports = {}) => {
  let code = compile(await readFile(new URL(path, import.meta.url), "utf8"));
  for (const [specifier, moduleUrl] of Object.entries(imports)) code = code.replaceAll(JSON.stringify(specifier), JSON.stringify(moduleUrl));
  return url(code);
};
const mathUrl = await load("../src/data/mathTreeTrefilarias.ts");
const mathCalcUrl = await load("../src/utils/mathTreeCalculations.ts", { "../data/mathTreeTrefilarias": mathUrl });
const transportUrl = await load("../src/data/transportComposition.ts", { "./mathTreeTrefilarias": mathUrl });
const logisticsUrl = await load("../src/data/logisticsTree.ts", { "./mathTreeTrefilarias": mathUrl, "./transportComposition": transportUrl });
const calcUrl = await load("../src/utils/logisticsCalculations.ts", { "../data/logisticsTree": logisticsUrl, "./mathTreeCalculations": mathCalcUrl });
const transportCalcUrl = await load("../src/utils/transportCalculations.ts", { "../data/logisticsTree": logisticsUrl, "../data/transportComposition": transportUrl, "./mathTreeCalculations": mathCalcUrl });
const { costComponents } = await import(mathUrl);
const data = await import(logisticsUrl), calc = await import(calcUrl);
const transport = await import(transportUrl), transportCalc = await import(transportCalcUrl);
const context = { unit: "all", scenario: "MRF04", period: null };

test("Logistics has four requested branches; SB explicitly maps to Sa and uncertain registrations remain flagged", () => {
  assert.deepEqual(data.logisticsHierarchy.filter(item => item.parentId === "logistics").map(item => item.name), ["Transporte Interno", "Gerência Trefilaria", "Planejamento e Programação", "Expedição de Trefilados"]);
  assert.equal(data.logisticsUnits.find(item => item.code === "SB").sourceCode, "Sa");
  assert.equal(data.normalizeMathUnit("SB"), "Sa");
  assert.equal(data.normalizeMathUnit("unknown"), "all");
  assert.ok(data.logisticsUnits.filter(item => ["SP", "Re"].includes(item.code)).every(item => item.pendingRegistration));
});
test("The root reuses the existing logistics reference exactly; no child cost or allocation is fabricated", () => {
  const source = costComponents.find(item => item.id === "administration");
  const root = data.logisticsFinancialInputs.filter(item => item.componentId === "logistics");
  assert.equal(root.length, 4);
  for (const row of root) {
    const reference = source.rows.find(item => item.unit === row.unit);
    assert.deepEqual(row.budget, reference.budget);
    assert.deepEqual(row.forecast, reference.forecast);
    assert.equal(row.period, null);
  }
  assert.equal(data.logisticsFinancialInputs.length, 28);
  for (const row of data.logisticsFinancialInputs.filter(item => item.componentId !== "logistics")) {
    assert.equal(row.provenance, "not-provided");
    assert.deepEqual([row.budget.absolute, row.budget.referenceUnitCost, row.forecast.absolute, row.forecast.referenceUnitCost], [null, null, null, null]);
  }
  assert.deepEqual(data.logisticsAllocations, []);
});
for (const unit of ["all", "JF", "SP", "Sa", "Re"]) {
  test(`${unit}: selected reference rows and variance match the parent without partial or missing totals becoming zero`, () => {
    const selectedContext = { ...context, unit };
    const rows = calc.getLogisticsRows("logistics", selectedContext);
    assert.equal(rows.length, unit === "all" ? 4 : 1);
    const totals = calc.getLogisticsTotals("logistics", selectedContext);
    assert.equal(totals.budget, rows.reduce((sum, row) => sum + row.budget.absolute, 0));
    assert.equal(totals.forecast, rows.reduce((sum, row) => sum + row.forecast.absolute, 0));
    assert.equal(totals.absolute, totals.forecast - totals.budget);
    for (const branch of data.logisticsHierarchy.slice(1)) {
      assert.deepEqual(calc.getLogisticsTotals(branch.id, selectedContext), { budget: null, forecast: null, absolute: null, percent: null, favorable: "neutral" });
    }
  });
}
test("Unknown reporting periods are preserved as context without relabeling undated source numbers", () => {
  const dated = { ...context, period: "YTD 2026" };
  assert.deepEqual(calc.getLogisticsRows("logistics", dated), []);
  assert.equal(calc.getLogisticsTotals("logistics", dated).budget, null);
});
test("Future integration guards zero denominators and incomplete rows, and supports multiple allocation centers", () => {
  const record = { ...data.logisticsFinancialInputs[0], budget: { absolute: 0, referenceUnitCost: null, unitDecimals: 2 }, forecast: { absolute: 10, referenceUnitCost: null, unitDecimals: 2 } };
  const totals = calc.getLogisticsTotals("logistics", { ...context, unit: record.unit }, [record]);
  assert.equal(totals.absolute, 10); assert.equal(totals.percent, null);
  assert.equal(calc.getLogisticsTotals("logistics", context, [record, { ...record, unit: "SP", budget: { ...record.budget, absolute: null } }]).budget, null);
  // Test fixtures only; these codes and percentages are not application data.
  const allocations = [35, 65].map((percentage, index) => ({ id: `test-${index}`, componentId: "transport", unit: "JF", scenario: "MRF04", period: null, costCenter: `TEST-${index}`, rule: "test fixture", percentage, originUnit: "JF", destinationUnit: "SP" }));
  assert.equal(calc.getLogisticsAllocations("transport", context, allocations).length, 2);
  assert.equal(calc.getLogisticsAllocations("transport", { ...context, unit: "SP" }, allocations).length, 0);
  assert.equal(calc.getLogisticsAllocations("transport", { ...context, period: "FY" }, allocations).length, 0);
});
test("Independent branch and allocation expansion recalculates spacing without node overlap", () => {
  for (const unit of ["all", "SP"]) for (const collapsed of [new Set(), new Set(["transport"]), new Set(data.logisticsHierarchy.slice(1).map(item => item.id))]) {
    for (const allocationOpen of [new Set(), new Set(["transport", "logistics", "management"])]) {
      const layout = calc.getLogisticsLayout(collapsed, allocationOpen, { ...context, unit });
      const children = data.logisticsHierarchy.filter(item => item.parentId === "logistics");
      for (let index = 1; index < children.length; index++) {
        const previous = children[index - 1].id, current = children[index].id;
        assert.ok(layout.positions.get(current).y >= layout.positions.get(previous).y + layout.height(previous) + 24);
      }
      assert.equal(layout.positions.size, 5);
    }
  }
});

test("Transport hierarchy and missing factor inputs match the requested composition without fabricated data", () => {
  assert.deepEqual(transport.transportHierarchy.filter(item => item.parentId === "transport").map(item => item.name), ["Máquinas de Apoio", "Transporte de Bobinas"]);
  assert.equal(transport.transportHierarchy.length, 2);
  for (const node of transport.transportHierarchy) assert.equal(data.logisticsHierarchy.some(child => child.parentId === node.id), false);
  assert.equal(transport.transportFactorInputs.length, 8);
  for (const row of transport.transportFactorInputs) assert.deepEqual([row.budget.quantity, row.budget.unitPrice, row.forecast.quantity, row.forecast.unitPrice], [null, null, null, null]);
});

test("Multiplication requires both known, finite, nonnegative factors; explicit zeros remain zero", () => {
  assert.equal(transportCalc.multiplyTransportFactors(2, 100), 200);
  assert.equal(transportCalc.multiplyTransportFactors(1.5, 20), 30);
  assert.equal(transportCalc.multiplyTransportFactors(0, 100), 0);
  assert.equal(transportCalc.multiplyTransportFactors(5, 0), 0);
  for (const values of [[null, 100], [2, null], [0, null], [NaN, 10], [2, Infinity], [-1, 100], [2, -1], [Number.MAX_VALUE, 2]]) assert.equal(transportCalc.multiplyTransportFactors(...values), null);
});

// Test fixtures only. No quantities, prices, or official costs below are application data.
const factors = [
  { componentId: "support-machines", unit: "JF", scenario: "MRF04", period: null, budget: { quantity: 2, unitPrice: 100 }, forecast: { quantity: 3, unitPrice: 120 } },
  { componentId: "coil-transport", unit: "JF", scenario: "MRF04", period: null, budget: { quantity: 4, unitPrice: 50 }, forecast: { quantity: 2, unitPrice: 80 } },
];
const official = (id, budget, forecast) => ({ ...data.logisticsFinancialInputs.find(row => row.unit === "JF"), componentId: id, budget: { absolute: budget, referenceUnitCost: null, unitDecimals: 2 }, forecast: { absolute: forecast, referenceUnitCost: null, unitDecimals: 2 } });

test("Each scenario calculates products and complete transport sums; missing units or a missing child prevent partial totals", () => {
  const machines = transportCalc.getTransportUnitCosts("support-machines", "JF", context, [], factors);
  const coils = transportCalc.getTransportUnitCosts("coil-transport", "JF", context, [], factors);
  assert.deepEqual([machines.budget.value, machines.forecast.value], [200, 360]);
  assert.deepEqual([coils.budget.value, coils.forecast.value], [200, 160]);
  const total = transportCalc.getTransportTotals("transport", { ...context, unit: "JF" }, [], factors);
  assert.deepEqual([total.budget, total.forecast, total.absolute], [400, 520, 120]);
  assert.ok(Math.abs(total.percent - 30) < 1e-8); assert.equal(total.pending, false);
  assert.equal(transportCalc.getTransportTotals("transport", context, [], factors).budget, null);
  assert.equal(transportCalc.getTransportUnitCosts("transport", "JF", context, [], factors.slice(0, 1)).budget.value, null);
  assert.equal(transportCalc.getTransportUnitCosts("transport", "JF", { ...context, period: "2026-09" }, [], factors).budget.value, null);
  assert.equal(transportCalc.getTransportUnitCosts("transport", "SP", context, [], factors).budget.value, null);
});

test("Official values always take precedence; discrepancies and missing detail remain pending without deriving factors", () => {
  const inputs = [official("transport", 999, 888), official("support-machines", 250, 370)];
  const before = JSON.stringify({ inputs, factors });
  const total = transportCalc.getTransportUnitCosts("transport", "JF", context, inputs, factors);
  assert.deepEqual([total.budget.official, total.budget.calculated, total.budget.value], [999, 450, 999]);
  assert.equal(total.budget.pending, true); assert.equal(total.budget.difference, -549);
  assert.equal(total.forecast.value, 888);
  const pending = transportCalc.getTransportUnitCosts("transport", "JF", context, inputs, []);
  assert.equal(pending.budget.value, 999); assert.equal(pending.budget.calculated, null); assert.equal(pending.budget.pending, true);
  assert.equal(JSON.stringify({ inputs, factors }), before);
  assert.equal(transportCalc.getTransportFactors("support-machines", "JF", context, []), undefined);
});

test("Currency rounding does not create false differences, and missing official values are not treated as zero", () => {
  const matching = transportCalc.reconcileTransportCost(0.3, 3 * 0.1);
  assert.equal(matching.value, 0.3); assert.equal(matching.difference, 0); assert.equal(matching.pending, false);
  assert.equal(transportCalc.reconcileTransportCost(0, 100).value, 0);
  assert.equal(transportCalc.reconcileTransportCost(null, null).value, null);
  assert.equal(transportCalc.reconcileTransportCost(null, 50).value, 50);
});

test("Progressive expansion preserves state, orders every level left-to-right and avoids overlaps", () => {
  for (const unit of ["all", "JF"]) for (let mask = 0; mask < 8; mask++) {
    const expanded = new Set(["transport", "support-machines", "coil-transport"].filter((_, index) => mask & (1 << index)));
    const copy = [...expanded];
    const layout = calc.getLogisticsLayout(new Set(), new Set(["support-machines", "management"]), { ...context, unit }, expanded);
    const expected = !(mask & 1) ? 5 : 7;
    assert.equal(layout.visible.size, expected);
    assert.deepEqual([...expanded], copy);
    for (const id of layout.visible) {
      const node = data.logisticsHierarchy.find(item => item.id === id);
      if (node.parentId) {
        assert.ok(layout.visible.has(node.parentId));
        assert.ok(layout.positions.get(id).x > layout.positions.get(node.parentId).x);
      }
    }
    const ids = [...layout.visible];
    for (let first = 0; first < ids.length; first++) for (let second = first + 1; second < ids.length; second++) {
      const a = layout.positions.get(ids[first]), b = layout.positions.get(ids[second]);
      if (a.x !== b.x) continue;
      const aAbove = a.y < b.y;
      assert.ok(aAbove ? a.y + layout.height(ids[first]) + 24 <= b.y + 0.001 : b.y + layout.height(ids[second]) + 24 <= a.y + 0.001);
    }
  }
});
