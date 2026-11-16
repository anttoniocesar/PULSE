export type IndustrialUnit = "JF" | "SP" | "Sa" | "Re";
export type MathTreeUnit = "all" | IndustrialUnit;
export type CostNodeId = "total" | "direct" | "indirect" | "administration" | "operating" | "gendt" | "corporate" | "allocations";
export type MathNodeId = CostNodeId | "production";
export const industrialUnits: IndustrialUnit[] = ["JF", "SP", "Sa", "Re"];
export const mathTreeScenario = { id: "MRF04", business: "Trefilarias", budget: "BDG" } as const;

export const mathTreeSource = {
  label: "Referência visual PULSE anexada à Etapa 04",
  status: "pending-validation",
  note: "A imagem da árvore original não foi fornecida. Entradas transcritas da proposta visual disponível; validar com a origem antes de qualquer uso financeiro.",
  missingValue: "Não informado — validar na origem",
} as const;

export type CostInput = {
  absolute: number | null;
  referenceUnitCost: number | null;
  unitDecimals: 0 | 2;
};
export type CostRow = { unit: IndustrialUnit; scenario: "MRF04"; budget: CostInput; forecast: CostInput };
export type CostComponent = {
  id: CostNodeId;
  name: string;
  parentId: CostNodeId | null;
  rows: CostRow[];
  allocationBasis: "not-confirmed";
};

export const productionInputs: { unit: IndustrialUnit; scenario: "MRF04"; budget: number | null; forecast: number | null }[] = [
  { unit: "JF", scenario: "MRF04", budget: 201961, forecast: 245084 },
  { unit: "SP", scenario: "MRF04", budget: 93378, forecast: 95066 },
  { unit: "Sa", scenario: "MRF04", budget: 166798, forecast: 131542 },
  { unit: "Re", scenario: "MRF04", budget: 134167, forecast: 77952 },
];

// Each tuple: BDG absolute, BDG R$/t, MRF absolute, MRF R$/t.
// null is reserved for unreadable/missing source values; never fill those by estimation.
type InputTuple = [number | null, number | null, number | null, number | null];
function component(id: CostNodeId, name: string, parentId: CostNodeId | null, entries: InputTuple[], budgetDecimals: 0 | 2 = 0, forecastDecimals: 0 | 2 = 0): CostComponent {
  return {
    id, name, parentId, allocationBasis: "not-confirmed",
    rows: industrialUnits.map((unit, index) => ({
      unit, scenario: "MRF04",
      budget: { absolute: entries[index][0], referenceUnitCost: entries[index][1], unitDecimals: budgetDecimals },
      forecast: { absolute: entries[index][2], referenceUnitCost: entries[index][3], unitDecimals: forecastDecimals },
    })),
  };
}

export const costComponents: CostComponent[] = [
  component("total", "Custo Total de Produção", null, [
    [103003146, 610, 98466567, 402], [58711223, 629, 54173834, 570],
    [81993951, 492, 77142384, 586], [64476358, 481, 55984182, 718],
  ]),
  component("direct", "Custos Diretos", "total", [
    [85255562, 422, 81702903, 333], [48843562, 523, 46055939, 484],
    [67991300, 408, 65278324, 496], [53676269, 400, 46209067, 593],
  ]),
  component("indirect", "Custos Indiretos", "total", [
    [17747584, 88, 16763664, 68], [9867661, 106, 8117896, 85],
    [14002650, 84, 11864060, 90], [10800089, 80, 9775115, 125],
  ]),
  component("administration", "Custos Administrativos | Logística", "direct", [
    [25904783, 128.27, 24303901, 99], [9763599, 104.56, 9543747, 100],
    [10403258, 62.37, 9726077, 74], [16247938, 121.10, 14146786, 181],
  ], 2),
  component("operating", "Custos Operacionais", "direct", [
    [59350779, 293.87, 57399002, 234], [39079963, 418.51, 36512192, 384],
    [57588042, 345.26, 55552247, 422], [37428331, 278.97, 32062281, 411],
  ], 2),
  component("gendt", "GENDT — C. C. Distribuidor", "direct", [
    [22542561, 111.62, 18982013, 77], [10241362, 109.68, 4804350, 51],
    [14020410, 84.06, 10829370, 82], [20450611, 152.43, 15042079, 193],
  ], 2),
  component("corporate", "Custos Indiretos Corporativo", "indirect", [
    [8267205, 40.93, 7334759, 30], [4056550, 43.44, 3715165, 39],
    [4878341, 29.25, 4193326, 32], [3354645, 25, 3289574, 42],
  ], 2),
  component("allocations", "Custos Indiretos | Rateios", "indirect", [
    [9480379, 46.94, 9428905, 38.47], [5811112, 62.23, 4402731, 46.31],
    [9124309, 54.70, 7670734, 58.31], [7445444, 55.49, 6485541, 83.20],
  ], 2, 2),
];

export const sourceValidationNotes = [
  "Validar todas as entradas com a árvore original, não anexada. Os badges percentuais da proposta visual não são usados como entrada.",
  "Custo Total / JF / BDG: a referência informa 610 R$/t. A razão indicativa entre custo e produção é próxima de 510 R$/t. Preservado o valor 610, sem assumir a base de alocação.",
  "Custos Diretos: a soma dos três filhos não reconcilia com o pai. GENDT foi mantido conforme a hierarquia solicitada, sem somá-lo novamente ao total.",
  "Há diferenças de arredondamento ou transcrição de R$ 1 em alguns totais. Os valores de entrada foram preservados.",
] as const;
