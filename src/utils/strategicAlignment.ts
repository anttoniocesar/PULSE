import type { Period, Unit } from "../data/demoData";
import { strategicConfiguration, strategicSource, type StrategicConfiguration, type StrategicProject, type StrategicSource } from "../data/strategicAlignment";

const numeric = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const unique = (projects: readonly StrategicProject[]) => [...new Map(projects.filter(project => !!project.id).map(project => [project.id, project])).values()];
export type StrategySelection = { kind: "root" } | { kind: "driver" | "category" | "pillar"; id: string };
export type StrategyGroup = {
  projects: StrategicProject[];
  count: number | null;
  prioritized: number | null;
  transformational: number | null;
  incremental: number | null;
  associatedValue: number | null;
  realized: number | null;
  forecast: number | null;
  performance: number | null;
  classificationCoverage: number;
  typeCoverage: number;
  priorityCoverage: number;
  portfolioCount: number | null;
  coveragePercent: number | null;
  complete: boolean;
};
function summarize(projects: StrategicProject[], known: boolean, covered: number, portfolioCount: number | null, complete: boolean): StrategyGroup {
  const rows = unique(projects);
  const available = known && (covered > 0 || portfolioCount === 0 || rows.length > 0);
  const typeCoverage = rows.filter(project => project.type === "transformational" || project.type === "incremental").length;
  const priorityCoverage = rows.filter(project => typeof project.prioritized === "boolean").length;
  const countType = (type: StrategicProject["type"]) => {
    const matches = rows.filter(project => project.type === type).length;
    return available && (matches > 0 || complete && typeCoverage === rows.length) ? matches : null;
  };
  const sum = (field: "associatedValue" | "realized" | "forecast" | "expected") => {
    // Unknown membership or incomplete benefits cannot produce a purported full financial total.
    if (!available || !complete || rows.some(project => !numeric(project[field]))) return null;
    const total = rows.reduce((value, project) => value + project[field]!, 0);
    return numeric(total) ? total : null;
  };
  const realized = sum("realized"), expected = sum("expected");
  const deviation = realized !== null && expected !== null && expected > 0 ? (realized / expected - 1) * 100 : null;
  return {
    projects: rows, count: available && (complete || rows.length > 0) ? rows.length : null,
    prioritized: available && (rows.some(project => project.prioritized === true) || complete && priorityCoverage === rows.length) ? rows.filter(project => project.prioritized === true).length : null,
    transformational: countType("transformational"), incremental: countType("incremental"),
    associatedValue: sum("associatedValue"), realized, forecast: sum("forecast"), performance: numeric(deviation) ? deviation : null,
    classificationCoverage: covered, typeCoverage, priorityCoverage, portfolioCount,
    coveragePercent: available && complete && portfolioCount !== null && portfolioCount > 0 ? rows.length / portfolioCount * 100 : available && portfolioCount === 0 ? 0 : null,
    complete: known && complete,
  };
}

export function getStrategicAlignment(unit: Unit, period: Period, area = "all", source: StrategicSource = strategicSource, config: StrategicConfiguration = strategicConfiguration) {
  const known = source.projects !== null;
  const scoped = unique((source.projects ?? []).filter(project => project.scope === period)).filter(project => project.lifecycle !== "inactive" && project.lifecycle !== "cancelled");
  const unitComplete = unit === "all" || scoped.every(project => project.unit === "A" || project.unit === "B");
  const unitRows = scoped.filter(project => unit === "all" || project.unit === unit);
  const areas = [...new Set(unitRows.map(project => project.area).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const effectiveArea = area === "all" || areas.includes(area) ? area : "all";
  const filterComplete = unitComplete && (effectiveArea === "all" || unitRows.every(project => project.area !== null));
  const projects = unitRows.filter(project => effectiveArea === "all" || project.area === effectiveArea);
  const portfolioCount = known && (filterComplete || projects.length > 0) ? projects.length : null;
  const categoryIds = config.drivers.flatMap(driver => driver.categories.map(category => category.id));
  const categoriesKnown = projects.filter(project => Array.isArray(project.categoryIds) && project.categoryIds.every(id => categoryIds.includes(id)));
  const pillarsKnown = projects.filter(project => Array.isArray(project.pillarIds) && project.pillarIds.every(id => config.pillars.some(pillar => pillar.id === id)));
  const group = (rows: StrategicProject[], covered: number) => summarize(rows, known, covered, portfolioCount, filterComplete && covered === projects.length);
  const root = group(projects, projects.length);
  const drivers = config.drivers.map(driver => ({ ...driver, summary: group(projects.filter(project => project.categoryIds?.some(id => driver.categories.some(category => category.id === id))), categoriesKnown.length), categories: driver.categories.map(category => ({ ...category, summary: group(projects.filter(project => project.categoryIds?.includes(category.id)), categoriesKnown.length) })) }));
  const pillars = config.pillars.map(pillar => ({ ...pillar, summary: group(projects.filter(project => project.pillarIds?.includes(pillar.id)), pillarsKnown.length) }));
  return { root, drivers, pillars, known, areas, effectiveArea, unit, period, config, unclassifiedCategories: projects.length - projects.filter(project => project.categoryIds?.some(id => categoryIds.includes(id))).length, unclassifiedPillars: projects.length - projects.filter(project => project.pillarIds?.some(id => config.pillars.some(pillar => pillar.id === id))).length };
}
export type StrategicAlignmentView = ReturnType<typeof getStrategicAlignment>;

export function selectStrategicGroup(view: StrategicAlignmentView, selection: StrategySelection) {
  if (selection.kind === "root") return { ...view.config.root, summary: view.root };
  if (selection.kind === "driver") return view.drivers.find(driver => driver.id === selection.id);
  if (selection.kind === "category") return view.drivers.flatMap(driver => driver.categories).find(category => category.id === selection.id);
  return view.pillars.find(pillar => pillar.id === selection.id);
}
