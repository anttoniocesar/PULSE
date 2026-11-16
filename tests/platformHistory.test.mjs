import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/platformHistory.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { createPlatformHistory } = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
const create = () => createPlatformHistory(path => ["/home", "/home/performance", "/math-tree/cost"].includes(path));
const entry = (index, pathname, key = String(index)) => ({ index, pathname, key });

test("Direct access and unknown preceding entries never authorize browser Back", () => {
  for (const index of [0, 1, 50]) {
    const history = create();
    history.record(entry(index, "/math-tree/cost"), "POP");
    assert.equal(history.canGoBack(index, String(index)), false);
  }
});

test("Observed Overview and other internal pages authorize Back only for the current entry", () => {
  for (const path of ["/home", "/home/performance"]) {
    const history = create();
    history.record(entry(0, path), "POP");
    history.record(entry(1, "/math-tree/cost"), "PUSH");
    assert.equal(history.canGoBack(1, "1"), true);
    assert.equal(history.canGoBack(1, "stale-key"), false);
  }
});

test("Replace updates the current key without creating another Back entry", () => {
  const history = create();
  history.record(entry(0, "/home"), "POP");
  history.record(entry(1, "/math-tree/cost"), "PUSH");
  history.record(entry(1, "/math-tree/cost", "filter-change"), "REPLACE");
  assert.equal(history.canGoBack(1, "filter-change"), true);
  assert.equal(history.canGoBack(1, "1"), false);
});

test("Unknown routes, login and external-looking paths are excluded", () => {
  for (const path of ["/login", "/unknown", "https://outside.example/home", "//outside.example/home"]) {
    const history = create();
    history.record(entry(0, "/home"), "POP");
    history.record(entry(0, path, "replaced"), "REPLACE");
    history.record(entry(1, "/math-tree/cost"), "PUSH");
    assert.equal(history.canGoBack(1, "1"), false);
  }
});

test("POP supports Back/Forward and a new PUSH discards the abandoned forward branch", () => {
  const history = create();
  history.record(entry(0, "/home"), "POP");
  history.record(entry(1, "/math-tree/cost"), "PUSH");
  history.record(entry(2, "/home/performance"), "PUSH");
  history.record(entry(0, "/home"), "POP");
  assert.equal(history.canGoBack(0, "0"), false);
  history.record(entry(1, "/math-tree/cost"), "POP");
  assert.equal(history.canGoBack(1, "1"), true);
  history.record(entry(0, "/home"), "POP");
  history.record(entry(1, "/home/performance", "new-branch"), "PUSH");
  assert.equal(history.canGoBack(2, "2"), false);
  assert.equal(history.canGoBack(1, "new-branch"), true);
});

test("Missing, negative and noninteger browser indices fail safely", () => {
  const history = create();
  history.record(entry(0, "/home"), "POP");
  for (const index of [undefined, null, NaN, Infinity, -1, 0.5, "1"]) {
    history.record(entry(index, "/math-tree/cost"), "PUSH");
    assert.equal(history.canGoBack(index, String(index)), false);
  }
});
