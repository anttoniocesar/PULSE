import { TriangleAlert } from "lucide-react";
import type { Initiative } from "../../data/demoData";

export default function InitiativeList({ initiatives }: { initiatives: Initiative[] }) {
  return (
    <div className="initiative-list">
      <p className="initiative-list__count">{initiatives.length} registros demonstrativos</p>
      <ul>{initiatives.map(item => <li key={item.id} className={`initiative-record${item.atRisk ? " initiative-record--risk" : ""}`}>
        <div className="initiative-record__top"><span>{item.id} · Unidade {item.unit}</span><span className="initiative-stage">{item.stage}</span></div>
        <h3>{item.name}</h3><p>{item.area} · {item.owner}</p>
        <div className="initiative-record__status">{item.atRisk && <TriangleAlert size={13} aria-hidden="true" />}<span>{item.status}</span></div>
        {item.atRisk && <p className="initiative-record__reason">{item.reason}</p>}
      </li>)}</ul>
    </div>
  );
}
