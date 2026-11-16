import { ArrowRight, TriangleAlert } from "lucide-react";
import type { DashboardData } from "../../data/demoData";

export default function ManagementAttention({ data, onClick }: { data: DashboardData; onClick: () => void }) {
  return (
    <section className="management-attention" id="management-attention" aria-labelledby="management-title">
      <span className="management-attention__icon"><TriangleAlert size={22} strokeWidth={1.7} aria-hidden="true" /></span>
      <div><h2 id="management-title">Riscos sinalizados na base demonstrativa</h2><p><strong>{data.risks.length} iniciativas em risco</strong><span>Avaliar prazos, bloqueios e impacto no forecast. Este sinal não representa a classificação geral de saúde.</span></p></div>
      <button className="dashboard-button dashboard-button--attention" onClick={onClick}>Consultar pendências<ArrowRight size={16} aria-hidden="true" /></button>
    </section>
  );
}
