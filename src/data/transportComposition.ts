import { industrialUnits, type IndustrialUnit } from "./mathTreeTrefilarias";

export const transportHierarchy = [
  { id: "support-machines", parentId: "transport", name: "Máquinas de Apoio", kind: "cost" },
  { id: "coil-transport", parentId: "transport", name: "Transporte de Bobinas", kind: "cost" },
] as const;
export type TransportComponentId = "support-machines" | "coil-transport";
export const transportCompositions = [
  { id: "support-machines", quantityLabel: "Quantidade de máquinas", priceLabel: "Preço por máquina (R$/máquina)", priceUnit: "R$/máquina", formula: "Quantidade de Máquinas × Preço por Máquina" },
  { id: "coil-transport", quantityLabel: "Quantidade de caminhões", priceLabel: "Preço por caminhão (R$/caminhão)", priceUnit: "R$/caminhão", formula: "Quantidade de Caminhões × Preço por Caminhão" },
] as const;

export type TransportFactorInput = {
  componentId: TransportComponentId;
  unit: IndustrialUnit;
  scenario: "MRF04";
  period: string | null;
  budget: { quantity: number | null; unitPrice: number | null };
  forecast: { quantity: number | null; unitPrice: number | null };
};
// No quantities or prices have been provided. Never infer these factors from official costs.
export const transportFactorInputs: TransportFactorInput[] = transportCompositions.flatMap(component => industrialUnits.map(unit => ({
  componentId: component.id, unit, scenario: "MRF04", period: null,
  budget: { quantity: null, unitPrice: null }, forecast: { quantity: null, unitPrice: null },
})));
