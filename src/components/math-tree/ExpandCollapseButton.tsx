export default function ExpandCollapseButton({ expanded, label, onClick }: { expanded: boolean; label: string; onClick: () => void }) {
  return <button className="math-expand nodrag nopan" type="button" onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onClick(); }} aria-label={`${expanded ? "Recolher" : "Expandir"} ${label}`} aria-expanded={expanded} title={`${expanded ? "Recolher" : "Expandir"} ramo`}>
    <span aria-hidden="true">{expanded ? "−" : "+"}</span>
  </button>;
}
