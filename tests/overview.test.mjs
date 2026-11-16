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
const demoUrl = await moduleUrl("../src/data/demoData.ts");
const definitionsUrl = await moduleUrl("../src/data/overviewData.ts");
const demo = await import(demoUrl), definitions = await import(definitionsUrl);
const calc = await import(await moduleUrl("../src/utils/overviewCalculations.ts", { "../data/demoData": demoUrl, "../data/overviewData": definitionsUrl }));
const rules = definitions.overviewRules;
const configured = { scheduleDelayDays: { attention: 3, critical: 10 }, financialShortfallPercent: { attention: 5, critical: 20 }, riskScore: { attention: 5, critical: 8 }, staleAfterDays: 30 };
const empty = { referenceDate: null, records: [], capture: [] };
const assessment = level => ({ level, reason: `${level} from test source` });
const record = (id, extra = {}) => ({ initiativeId: id, scope: "YTD", ...extra });

for (const unit of ["all", "A", "B"]) for (const period of ["YTD", "FY"]) test(`${unit}/${period}: existing seven KPIs, portfolio and monetary values preserved, and every section shares scope`, () => {
  const base = demo.getDashboardData(unit, period), view = calc.getOverviewData(unit, period);
  for (const metric of demo.metrics) assert.equal(demo.getMetricValue(metric.key, view.data), demo.getMetricValue(metric.key, base));
  assert.deepEqual(view.data, base);
  assert.equal(view.health.length, base.initiatives.length);
  assert.equal(view.maturity.stages.reduce((sum, row) => sum + row.count, 0), base.initiatives.length);
  assert.ok(Math.abs(view.maturity.stages.reduce((sum, row) => sum + row.percent, 0) - 100) < 1e-8);
  assert.equal(view.capture.length, 0); // Existing synthetic trend is not an operational history.
  assert.equal(view.data.trend.length, 12);
  assert.ok(view.health.every(item => item.overall === null && item.coverage === 0));
  assert.ok(view.alerts.every(group => group.count === null && group.coverage === 0 && group.alerts.length === 0 && group.total === base.initiatives.length));
});

test("No undocumented thresholds or seven-day rule are activated", () => {
  assert.deepEqual(rules, { scheduleDelayDays: null, financialShortfallPercent: null, riskScore: null, staleAfterDays: null });
  const result = calc.classifyInitiative(record("A-001", { schedule: { dueDate: "2026-01-01", completedAt: null }, financial: { expected: 100, actual: 90 }, riskScore: 9 }), rules, "2026-09-30");
  assert.equal(result.coverage, 0); assert.equal(result.overall, null);
});

test("Overall health is the worst dimension only with three valid assessments; partial favorable or critical evidence stays partial", () => {
  const partial = calc.classifyInitiative(record("A-001", { assessments: { schedule: assessment("onTrack"), risk: assessment("critical") } }), rules, null);
  assert.equal(partial.coverage, 2); assert.equal(partial.overall, null); assert.equal(partial.observed, "critical");
  assert.match(partial.reason, /Resultado financeiro/);
  const full = calc.classifyInitiative(record("A-001", { assessments: { schedule: assessment("onTrack"), financial: assessment("attention"), risk: assessment("critical") } }), rules, null);
  assert.equal(full.coverage, 3); assert.equal(full.overall, "critical"); assert.equal(full.reason, "critical from test source");
  assert.equal(calc.classifyInitiative(record("A-001", { assessments: { risk: assessment("invalid") } }), rules, null).coverage, 0);
});

test("Configured schedule, financial and risk limits classify source inputs without zero division or invalid dates", () => {
  const input = record("A-001", { schedule: { dueDate: "2026-09-25", completedAt: null }, financial: { expected: 100, actual: 75 }, riskScore: 1 });
  const result = calc.classifyInitiative(input, configured, "2026-09-30");
  assert.deepEqual(result.assessments.map(item => item.level), ["attention", "critical", "onTrack"]);
  assert.equal(result.overall, "critical");
  const invalid = calc.classifyInitiative(record("A-001", { schedule: { dueDate: "2026-02-30", completedAt: null }, financial: { expected: 0, actual: 0 }, riskScore: NaN }), configured, "2026-09-30");
  assert.equal(invalid.overall, null); assert.equal(invalid.coverage, 0);
  assert.equal(calc.parseReportingDate("2026-02-30"), null);
  assert.equal(calc.parseReportingDate("2026-13-01"), null);
  assert.equal(calc.parseReportingDate("invalid"), null);
  assert.equal(calc.classifyInitiative(record("A-001", { schedule: { dueDate: "2026-09-01", completedAt: "2026-12-01" } }), configured, "2026-09-30").coverage, 0);
  assert.notEqual(calc.parseReportingDate("2024-02-29"), null);
});

test("Maturity counts current stage once, reports unknown stages and guards an empty portfolio", () => {
  const initiative = demo.demoInitiatives[0];
  const result = calc.aggregateMaturity([initiative, initiative, { ...initiative, id: "unknown", stage: null }]);
  assert.equal(result.stages.reduce((sum, row) => sum + row.count, 0), 1);
  assert.equal(result.stages[0].percent, 50); assert.equal(result.unclassified, 1);
  assert.ok(calc.aggregateMaturity([]).stages.every(row => row.count === 0 && row.percent === 0));
});

test("Overdue milestones use source reference date, explicit pending status and valid dates; missing data never creates an alert", () => {
  const item = { id: "m1", name: "Milestone", dueDate: "2026-09-29", status: "pending" };
  const source = record("A-001", { milestones: [item, item, { ...item, id: "m2", dueDate: "2026-09-30" }, { ...item, id: "m3", dueDate: null }, { ...item, id: "m4", dueDate: "2026-02-30" }, { ...item, id: "m5", status: "cancelled" }, { ...item, id: "m6", status: "completed" }] });
  assert.deepEqual(calc.identifyOverdueMilestones(source, "2026-09-30").map(row => row.id), ["m1"]);
  assert.equal(calc.identifyOverdueMilestones(source, null), null);
  assert.equal(calc.identifyOverdueMilestones(undefined, "2026-09-30"), null);
  assert.deepEqual(calc.identifyOverdueMilestones(record("A-001", { milestones: [] }), "2026-09-30"), []);
});

test("Pending decisions deduplicate, exclude resolved/cancelled and distinguish absence from an explicitly empty source", () => {
  const item = { id: "d1", description: "Decide", status: "pending" };
  assert.equal(calc.identifyPendingDecisions(undefined), null);
  assert.deepEqual(calc.identifyPendingDecisions(record("A-001", { decisions: [] })), []);
  assert.deepEqual(calc.identifyPendingDecisions(record("A-001", { decisions: [item, item, { ...item, id: "d2", status: "resolved" }, { ...item, id: "d3", status: "cancelled" }] })).map(row => row.id), ["d1"]);
});

test("Staleness requires valid update/reference dates and an explicit configured limit; missing/future timestamps do not create alerts", () => {
  assert.equal(calc.isOutdated("2026-08-01", "2026-09-30", 30), true);
  assert.equal(calc.isOutdated("2026-08-31", "2026-09-30", 30), false);
  for (const args of [[null, "2026-09-30", 30], ["invalid", "2026-09-30", 30], ["2026-12-01", "2026-09-30", 30], ["2026-08-01", null, 30], ["2026-08-01", "2026-09-30", null], ["2026-08-01", "2026-09-30", 0]]) assert.equal(calc.isOutdated(...args), null);
});

test("Inactive/cancelled initiatives are removed consistently, duplicate records count once and scope is respected", () => {
  const input = { ...empty, records: [record("A-001", { lifecycle: "cancelled" }), record("A-002", { lifecycle: "inactive" }), record("A-002", { lifecycle: "inactive" }), record("A-003", { scope: "FY", lifecycle: "cancelled" })] };
  const before = JSON.stringify(input), base = demo.getDashboardData("A", "YTD"), result = calc.getOverviewData("A", "YTD", input);
  assert.equal(result.data.initiatives.length, base.initiatives.length - 2);
  assert.equal(result.data.onBudget.length + result.data.delayed.length + result.data.interrupted.length, result.data.initiatives.length);
  assert.equal(result.data.pipeline.reduce((sum, row) => sum + row.count, 0), result.data.initiatives.length);
  assert.equal(result.health.length, result.data.initiatives.length);
  assert.ok(result.data.initiatives.some(row => row.id === "A-003"));
  assert.equal(JSON.stringify(input), before);
});

test("Alert groups retain coverage, owners, dates and required action without inventing events for absent records", () => {
  const first = record("A-001", { updatedAt: "2026-08-01", assessments: { schedule: assessment("critical"), financial: assessment("onTrack"), risk: assessment("attention") }, milestones: [{ id: "m", name: "Late source milestone", dueDate: "2026-09-01", status: "pending", owner: "Source owner" }], decisions: [{ id: "d", description: "Source decision", status: "pending", action: "Source action" }] });
  const second = record("A-002", { updatedAt: null, milestones: [], decisions: [] });
  const view = calc.getOverviewData("A", "YTD", { ...empty, referenceDate: "2026-09-30", records: [first, second] }, configured);
  assert.deepEqual(view.alerts.map(group => group.count), [1, 1, 1, 1]);
  assert.deepEqual(view.alerts.map(group => group.coverage), [1, 2, 2, 1]);
  assert.equal(view.alerts[1].alerts[0].owner, "Source owner");
  assert.equal(view.alerts[2].alerts[0].action, "Source action");
  assert.equal(view.alerts[3].alerts[0].dueDate, null);
});

const closing = (id, unit, month, planned, actual, forecast = null, scope = "YTD") => ({ id, unit, month, scope, plannedCumulative: planned, actualCumulative: actual, forecastCumulative: forecast });
test("Capture aggregates supplied cumulative closings, preserves temporal gaps, unknown series and unfavorable variance", () => {
  const rows = [closing("a1", "A", "2026-01", 4, 3), closing("b1", "B", "2026-01", 6, 5), closing("a3", "A", "2026-03", 12, 10), closing("b3", "B", "2026-03", 18, 15)];
  const result = calc.calculateCaptureAccumulated(rows, "all", "YTD");
  assert.deepEqual(result.map(point => point.month), ["2026-01", "2026-03"]);
  assert.deepEqual([result[0].planned, result[0].realized, result[0].variance, result[0].variancePercent], [10, 8, -2, -20]);
  assert.ok(result.every(point => point.forecast === null));
  assert.equal(calc.calculateCaptureAccumulated(rows, "A", "YTD")[1].planned, 12);
});

test("Capture never emits partial consolidated sums, treats explicit zero correctly and rejects duplicate/conflicting or invalid closings", () => {
  const row = closing("a", "A", "2026-01", 0, 0, 0);
  const missing = calc.calculateCaptureAccumulated([row, row], "all", "YTD")[0];
  assert.equal(missing.planned, null); assert.equal(missing.realized, null);
  const zero = calc.calculateCaptureAccumulated([row, row], "A", "YTD")[0];
  assert.deepEqual([zero.planned, zero.realized, zero.forecast, zero.variance, zero.variancePercent], [0, 0, 0, 0, null]);
  assert.equal(calc.calculateCaptureAccumulated([row, { ...row, id: "ambiguous" }], "A", "YTD")[0].planned, null);
  assert.deepEqual(calc.calculateCaptureAccumulated([closing("invalid", "A", "2026-13", 1, 2), closing("future", "A", "2026-10", 1, 2), closing("other", "B", "2026-01", 1, 2)], "A", "YTD"), []);
  assert.deepEqual(calc.calculateCaptureAccumulated([row], "A", "FY"), []);
  const overflow = calc.calculateCaptureAccumulated([closing("large-a", "A", "2026-01", Number.MAX_VALUE, 1), closing("large-b", "B", "2026-01", Number.MAX_VALUE, 1)], "all", "YTD")[0];
  assert.equal(overflow.planned, null); assert.equal(overflow.variance, null);
});
