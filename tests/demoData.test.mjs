import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Compile the self-contained data module in memory; works with the project's Node versions.
const source = await readFile(new URL("../src/data/demoData.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { getDashboardData, demoInitiatives, getMetricValue } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const rounded = value => Math.round(value * 100) / 100;

test("YTD opening values and stage distribution match the executive brief", () => {
  const data = getDashboardData();
  assert.deepEqual([data.potential, data.realized, data.forecast, data.initiatives.length, data.risks.length], [48.2, 31.5, 43.7, 126, 14]);
  assert.equal(getMetricValue("capture", data), "65,4%");
  assert.deepEqual(data.pipeline.map(item => item.count), [18, 21, 29, 26, 19, 13]);
  assert.deepEqual(data.areas.map(item => item.value), [18.5, 11.2, 9.4, 5.8, 3.3]);
  for (const [unit, expected] of [["A", [22.4, 15.8, 20.1, 58, 6]], ["B", [25.8, 15.7, 23.6, 68, 8]]]) {
    const selected = getDashboardData(unit);
    assert.deepEqual([selected.potential, selected.realized, selected.forecast, selected.initiatives.length, selected.risks.length], expected);
  }
});

for (const period of ["YTD", "FY"]) {
  test(`${period}: consolidated financial values and every monthly point equal the sum of the units`, () => {
    const all = getDashboardData("all", period);
    const a = getDashboardData("A", period);
    const b = getDashboardData("B", period);
    for (const key of ["potential", "realized", "forecast", "planned"]) assert.equal(all[key], rounded(a[key] + b[key]), key);
    for (let index = 0; index < 12; index++) {
      for (const key of ["planned", "realized", "forecast"]) {
        assert.equal(all.trend[index][key], a.trend[index][key] === null ? null : rounded(a.trend[index][key] + b.trend[index][key]), `${index}:${key}`);
      }
    }
    for (let index = 0; index < 5; index++) assert.equal(all.areas[index].value, rounded(a.areas[index].value + b.areas[index].value));
  });
  for (const unit of ["all", "A", "B"]) {
    test(`${unit}/${period}: real records support every stage and risk count; chart matches the KPIs`, () => {
      const data = getDashboardData(unit, period);
      assert.equal(data.pipeline.reduce((sum, item) => sum + item.count, 0), data.initiatives.length);
      for (const item of data.pipeline) assert.equal(data.initiatives.filter(record => record.stage === item.stage).length, item.count);
      assert.equal(data.risks.length, data.initiatives.filter(record => record.atRisk).length);
      assert.ok(data.risks.every(record => record.reason && record.owner.startsWith("Responsável Demo")));
      assert.ok(data.initiatives.every(record => (unit === "all" || record.unit === unit) && (period === "FY" || !record.annualOnly)));
      assert.equal(rounded(data.areas.reduce((sum, area) => sum + area.value, 0)), data.potential);
      assert.equal(data.trend[8].realized, data.realized);
      assert.equal(data.trend[8].forecast, data.realized);
      assert.equal(data.trend[11].forecast, data.forecast);
      assert.equal(data.trend[11].planned, data.planned);
      assert.ok(data.trend.slice(9).every(point => point.realized === null), "Future forecast must not appear as realized");
      assert.equal(data.capture, data.realized / data.potential * 100);
    });
  }
}

test("Annual scope adds planned records without turning future benefits into actuals", () => {
  assert.equal(new Set(demoInitiatives.map(item => item.id)).size, demoInitiatives.length);
  assert.equal(demoInitiatives.length, 144);
  for (const unit of ["all", "A", "B"]) {
    const ytd = getDashboardData(unit, "YTD");
    const fy = getDashboardData(unit, "FY");
    assert.ok(fy.initiatives.length > ytd.initiatives.length);
    assert.ok(fy.potential > ytd.potential);
    assert.ok(fy.forecast > ytd.forecast);
    assert.ok(fy.risks.length > ytd.risks.length);
    assert.equal(fy.realized, ytd.realized);
  }
});

test("Initiative KPI classifications match the requested totals and partition each filtered portfolio", () => {
  for (const [unit, expected] of [["all", [94, 21, 11]], ["A", [44, 9, 5]], ["B", [50, 12, 6]]]) {
    const data = getDashboardData(unit);
    assert.deepEqual([data.onBudget.length, data.delayed.length, data.interrupted.length], expected);
  }
  for (const period of ["YTD", "FY"]) {
    const a = getDashboardData("A", period), b = getDashboardData("B", period);
    for (const unit of ["all", "A", "B"]) {
      const data = getDashboardData(unit, period);
      const records = [data.onBudget, data.delayed, data.interrupted].flat();
      assert.equal(records.length, data.initiatives.length);
      assert.equal(new Set(records.map(item => item.id)).size, data.initiatives.length);
      for (const key of ["onBudget", "delayed", "interrupted"]) {
        assert.ok(data[key].every(item => item.executionStatus === key));
        assert.equal(getMetricValue(key, data), String(data[key].length));
        if (unit === "all") assert.equal(data[key].length, a[key].length + b[key].length);
      }
    }
  }
});
