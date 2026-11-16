import type { Period } from "./demoData";

export type StrategyDefinition = { id: string; label: string; description: string };
export type StrategicConfiguration = {
  root: StrategyDefinition;
  pillars: readonly StrategyDefinition[];
  drivers: readonly (StrategyDefinition & { categories: readonly StrategyDefinition[] })[];
};
export const strategicConfiguration: StrategicConfiguration = {
  root: { id: "strategy", label: "ESTRATÉGIA DA EMPRESA", description: "Portfólio único de projetos; priorização e tipo são informados pela fonte, sem inferência a partir das iniciativas." },
  pillars: [
    { id: "growth", label: "Crescimento", description: "Projetos associados explicitamente ao pilar Crescimento." },
    { id: "competitiveness", label: "Competitividade", description: "Projetos associados explicitamente ao pilar Competitividade." },
    { id: "profitability", label: "Rentabilidade", description: "Projetos associados explicitamente ao pilar Rentabilidade." },
    { id: "sustainability", label: "Sustentabilidade", description: "Projetos associados explicitamente ao pilar Sustentabilidade." },
  ],
  drivers: [
    { id: "revenue", label: "AUMENTO DE RECEITA", description: "União dos projetos classificados nas categorias de receita, sem duplicação entre categorias.", categories: [
      { id: "core", label: "Proteger o Core Business", description: "Classificação explícita de proteção do negócio principal." },
      { id: "new-business", label: "Receita com Novos Negócios", description: "Classificação explícita de receita com novos negócios." },
    ] },
    { id: "cost", label: "REDUÇÃO DE CUSTO", description: "União dos projetos classificados nas categorias de custo, sem duplicação entre categorias.", categories: [
      { id: "rolled", label: "Cost Rolled", description: "Categoria Cost Rolled conforme cadastro estratégico; nenhuma classificação é deduzida da área." },
      { id: "beyond-rolled", label: "Cost Beyond Rolled", description: "Categoria Cost Beyond Rolled conforme cadastro estratégico da fonte." },
    ] },
  ],
};

export type StrategicProject = {
  id: string;
  name: string | null;
  unit: "A" | "B" | null;
  area: string | null;
  scope: Period;
  owner: string | null;
  status: string | null;
  lifecycle?: "active" | "cancelled" | "inactive";
  prioritized: boolean | null;
  type: "transformational" | "incremental" | null;
  pillarIds: readonly string[] | null;
  categoryIds: readonly string[] | null;
  initiativeIds: readonly string[] | null; // Source linkage only; initiatives are not implicitly projects.
  associatedValue: number | null; // All monetary fields are supplied in R$ millions for this scope.
  realized: number | null;
  forecast: number | null;
  expected: number | null;
};
export type StrategicSource = { projects: readonly StrategicProject[] | null };
// null = project registry not loaded; [] = explicitly loaded, empty portfolio.
// No project, strategy classification, type, linkage or per-project benefit exists in demoData.
export const strategicSource: StrategicSource = { projects: null };
