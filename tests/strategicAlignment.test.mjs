import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function moduleUrl(file, replacements = {}) {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  for (const [from, to] of Object.entries(replacements)) outputText = outputText.replaceAll(`"${from}"`, JSON.stringify(to));
  return "data:text/javascript;base64," + Buffer.from(outputText).toString("base64");
}
const definitionsUrl = await moduleUrl("../src/data/strategicAlignment.ts");
const definitions = await import(definitionsUrl);
const calc = await import(await moduleUrl("../src/utils/strategicAlignment.ts", { "../data/strategicAlignment": definitionsUrl }));

// Fixtures only. No projects, labels, links or monetary numbers below are production data.
const project = (id, values = {}) => ({ id, name: `Test project ${id}`, unit: "A", area: "Operations", scope: "YTD", owner: "Test owner", status: "Active test record", prioritized: true, type: "transformational", pillarIds: ["growth", "profitability"], categoryIds: ["core", "rolled"], initiativeIds: ["A-001"], associatedValue: 12, realized: 5, forecast: 8, expected: 10, ...values });
const a = project("test-a");
const b = project("test-b", { unit: "B", area: "Energy", prioritized: false, type: "incremental", pillarIds: ["competitiveness"], categoryIds: ["core", "new-business"], associatedValue: 20, realized: 7, forecast: 10 });
const annual = project("test-a", { scope: "FY", realized: 9 });
const source = { projects: [a, b, annual] };

test("Production source is explicitly not loaded and contains no inferred demo projects or historical numbers", () => {
  assert.equal(definitions.strategicSource.projects, null);
  const view = calc.getStrategicAlignment("all", "YTD");
  assert.equal(view.known, false);
  for (const summary of [view.root, ...view.drivers.map(row => row.summary), ...view.drivers.flatMap(row => row.categories.map(category => category.summary)), ...view.pillars.map(row => row.summary)]) {
    assert.equal(summary.count, null); assert.equal(summary.prioritized, null); assert.equal(summary.transformational, null); assert.equal(summary.incremental, null);
    assert.equal(summary.realized, null); assert.equal(summary.forecast, null); assert.equal(summary.associatedValue, null); assert.equal(summary.coveragePercent, null);
    assert.deepEqual(summary.projects, []);
  }
});

test("Requested root, drivers, four categories and four pillars are configured independently of project data", () => {
  assert.equal(definitions.strategicConfiguration.root.label, "ESTRATÉGIA DA EMPRESA");
  assert.deepEqual(definitions.strategicConfiguration.drivers.map(row => row.label), ["AUMENTO DE RECEITA", "REDUÇÃO DE CUSTO"]);
  assert.deepEqual(definitions.strategicConfiguration.drivers.flatMap(row => row.categories.map(category => category.label)), ["Proteger o Core Business", "Receita com Novos Negócios", "Cost Rolled", "Cost Beyond Rolled"]);
  assert.deepEqual(definitions.strategicConfiguration.pillars.map(row => row.label), ["Crescimento", "Competitividade", "Rentabilidade", "Sustentabilidade"]);
});

for (const [unit, period, total] of [["all", "YTD", 2], ["A", "YTD", 1], ["B", "YTD", 1], ["all", "FY", 1], ["A", "FY", 1], ["B", "FY", 0]]) test(`${unit}/${period}: projects, driver members and pillar members share filters`, () => {
  const view = calc.getStrategicAlignment(unit, period, "all", source);
  assert.equal(view.root.count, total);
  assert.ok(view.root.projects.every(project => project.scope === period && (unit === "all" || project.unit === unit)));
  for (const group of [...view.drivers, ...view.drivers.flatMap(driver => driver.categories), ...view.pillars]) assert.ok(group.summary.projects.every(project => view.root.projects.includes(project)));
});

test("A project in multiple pillars/categories contributes once to portfolio and driver totals", () => {
  const view = calc.getStrategicAlignment("all", "YTD", "all", { projects: [a, a, { ...b, categoryIds: ["core", "core", "new-business"] }] });
  assert.equal(view.root.count, 2); assert.equal(view.root.prioritized, 1);
  assert.equal(view.root.transformational, 1); assert.equal(view.root.incremental, 1);
  assert.deepEqual([view.root.associatedValue, view.root.realized, view.root.forecast], [32, 12, 18]);
  assert.equal(view.drivers[0].summary.count, 2); assert.equal(view.drivers[0].summary.realized, 12);
  assert.deepEqual(view.pillars.map(row => row.summary.count), [1, 1, 1, 0]);
  assert.deepEqual(view.pillars.map(row => row.summary.coveragePercent), [50, 50, 50, 0]);
  assert.equal(view.pillars[0].summary.associatedValue, 12); assert.equal(view.pillars[2].summary.associatedValue, 12);
  assert.equal(view.root.performance, -40);
});

test("Missing classification or project type remains unknown rather than an empty favorable count", () => {
  const view = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("unknown", { prioritized: null, type: null, pillarIds: null, categoryIds: null, associatedValue: null, realized: null, forecast: null, expected: null })] });
  assert.equal(view.root.count, 1); assert.equal(view.root.prioritized, null); assert.equal(view.root.transformational, null);
  assert.equal(view.unclassifiedCategories, 1); assert.equal(view.unclassifiedPillars, 1);
  assert.ok(view.drivers.every(row => row.summary.count === null));
  assert.ok(view.pillars.every(row => row.summary.count === null && row.summary.coveragePercent === null));
});

test("Unknown members block complete financial/pillar totals even when some projects are classified", () => {
  const view = calc.getStrategicAlignment("all", "YTD", "all", { projects: [a, project("unclassified", { pillarIds: null, categoryIds: null })] });
  assert.equal(view.root.count, 2); assert.equal(view.root.realized, 10);
  const pillar = view.pillars[0].summary;
  assert.equal(pillar.count, 1); assert.equal(pillar.complete, false);
  assert.equal(pillar.realized, null); assert.equal(pillar.associatedValue, null); assert.equal(pillar.coveragePercent, null);
  assert.equal(view.drivers[0].summary.forecast, null);
  assert.equal(view.pillars[1].summary.count, null); // Unknown membership cannot be asserted to be zero.
});

test("Partial type/prioritization coverage does not emit misleading zero counts", () => {
  const view = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("known", { prioritized: false }), project("missing", { type: null, prioritized: null })] });
  assert.equal(view.root.transformational, 1);
  assert.equal(view.root.incremental, null);
  assert.equal(view.root.prioritized, null);
  assert.equal(view.root.typeCoverage, 1); assert.equal(view.root.priorityCoverage, 1);
});

test("Area and unit are filtered only from source fields; an unavailable area resets to all", () => {
  const view = calc.getStrategicAlignment("all", "YTD", "Operations", source);
  assert.deepEqual(view.areas, ["Energy", "Operations"]);
  assert.equal(view.effectiveArea, "Operations"); assert.equal(view.root.count, 1); assert.equal(view.root.realized, 5);
  assert.equal(calc.getStrategicAlignment("B", "YTD", "Operations", source).effectiveArea, "all");
  assert.equal(calc.getStrategicAlignment("B", "YTD", "Operations", source).root.realized, 7);
  const unknownUnit = calc.getStrategicAlignment("A", "YTD", "all", { projects: [project("unknown-unit", { unit: null })] });
  assert.equal(unknownUnit.root.count, null); assert.equal(unknownUnit.root.realized, null);
  const unknownArea = calc.getStrategicAlignment("A", "YTD", "Operations", { projects: [a, project("unknown-area", { area: null })] });
  assert.equal(unknownArea.root.count, 1); assert.equal(unknownArea.root.complete, false); assert.equal(unknownArea.root.realized, null);
});

test("Explicitly loaded empty portfolio produces zeros; missing money and zero planned value do not become ratios", () => {
  const empty = calc.getStrategicAlignment("all", "YTD", "all", { projects: [] });
  assert.equal(empty.known, true); assert.equal(empty.root.count, 0); assert.equal(empty.root.prioritized, 0); assert.equal(empty.root.realized, 0);
  assert.equal(empty.root.performance, null);
  const zero = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("zero", { realized: 0, expected: 0, forecast: null })] });
  assert.equal(zero.root.realized, 0); assert.equal(zero.root.forecast, null); assert.equal(zero.root.performance, null);
  const invalid = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("invalid", { realized: Infinity, associatedValue: NaN })] });
  assert.equal(invalid.root.realized, null); assert.equal(invalid.root.associatedValue, null);
});

test("Latest source revision wins per canonical ID; cancelled/inactive records are excluded and input remains unchanged", () => {
  const input = { projects: [a, { ...a, lifecycle: "cancelled" }, project("inactive", { lifecycle: "inactive" }), { ...b, realized: 6 }, b] };
  const before = JSON.stringify(input);
  const view = calc.getStrategicAlignment("all", "YTD", "all", input);
  assert.equal(view.root.count, 1); assert.equal(view.root.projects[0].id, b.id); assert.equal(view.root.realized, 7);
  assert.equal(JSON.stringify(input), before);
});

test("Category/pillar configuration is replaceable and only explicit recognized IDs establish membership", () => {
  const config = { root: { id: "custom", label: "Custom", description: "Configured" }, pillars: [{ id: "custom-pillar", label: "Custom pillar", description: "Configured" }], drivers: [{ id: "custom-driver", label: "Custom driver", description: "Configured", categories: [{ id: "custom-category", label: "Custom category", description: "Configured" }] }] };
  const view = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("custom", { pillarIds: ["custom-pillar"], categoryIds: ["custom-category"] })] }, config);
  assert.equal(view.drivers[0].summary.count, 1); assert.equal(view.pillars[0].summary.coveragePercent, 100);
  assert.equal(calc.selectStrategicGroup(view, { kind: "category", id: "custom-category" }).label, "Custom category");
  assert.equal(calc.selectStrategicGroup(view, { kind: "root" }).summary.count, 1);
  assert.equal(calc.selectStrategicGroup(view, { kind: "pillar", id: "custom-pillar" }).summary.realized, 5);
  const unknown = calc.getStrategicAlignment("all", "YTD", "all", { projects: [project("unknown", { categoryIds: ["unregistered"], pillarIds: ["unregistered"] })] });
  assert.equal(unknown.drivers[0].summary.count, null); assert.equal(unknown.pillars[0].summary.count, null);
});
