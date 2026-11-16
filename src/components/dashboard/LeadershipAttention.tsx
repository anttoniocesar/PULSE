import { ArrowUpRight, CircleAlert, Clock3, ListChecks, MessageSquare } from "lucide-react";
import type { AlertGroup, AlertKind } from "../../utils/overviewCalculations";

export const alertLabels: Record<AlertKind, string> = { critical: "Iniciativas críticas", milestones: "Marcos vencidos", decisions: "Decisões pendentes", stale: "Iniciativas sem atualização recente" };
const icons = { critical: CircleAlert, milestones: Clock3, decisions: MessageSquare, stale: ListChecks };
export default function LeadershipAttention({ groups, onSelect }: { groups: AlertGroup[]; onSelect: (kind: AlertKind) => void }) {
  return <div className="overview-alerts">{groups.map(group => {
    const Icon = icons[group.kind];
    return <button key={group.kind} className={`overview-alert${group.count ? ` overview-alert--${group.kind}` : ""}`} onClick={() => onSelect(group.kind)} aria-label={`Detalhar ${alertLabels[group.kind]}`}><span><Icon size={19} /><ArrowUpRight size={14} /></span><h3>{alertLabels[group.kind]}</h3><strong>{group.count === null ? "Não informado" : group.count}</strong><p>{group.coverage}/{group.total} iniciativas com base para avaliação</p>{group.count !== null && group.coverage < group.total && <small>Contagem parcial · cobertura incompleta</small>}</button>;
  })}</div>;
}

export function AlertDetails({ group }: { group: AlertGroup }) {
  return <div className="overview-detail-list"><p className="drawer-context-note">{group.note} Cobertura: {group.coverage} de {group.total} iniciativas. Informações ausentes não geram alertas automaticamente.</p>{group.alerts.length === 0 && <p className="overview-empty">{group.count === null ? "Não há dados suficientes para avaliar esta categoria. Integração pendente." : "Nenhuma ocorrência identificada nos registros avaliáveis desta seleção."}</p>}
    {group.alerts.map(alert => <article key={alert.id} className="overview-detail-record"><div className="overview-record-meta">{alert.initiative.id} · Unidade {alert.initiative.unit}</div><h3>{alert.initiative.name}</h3><p>{alert.description}</p><dl><div><dt>Responsável</dt><dd>{alert.owner || "Não informado"}</dd></div><div><dt>Prazo previsto</dt><dd>{alert.dueDate ? alert.dueDate.split("-").reverse().join("/") : "Não informado"}</dd></div><div><dt>Situação atual</dt><dd>{alert.status}</dd></div></dl><p><strong>Ação requerida:</strong> {alert.action}</p></article>)}
  </div>;
}
