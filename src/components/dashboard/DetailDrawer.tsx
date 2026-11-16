import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function DetailDrawer({ title, context, onClose, children }: { title: string; context: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog ref={dialogRef} className="detail-drawer" aria-labelledby="drawer-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="detail-drawer__surface">
        <header className="detail-drawer__header"><div><p>DETALHAMENTO DEMONSTRATIVO</p><h2 id="drawer-title">{title}</h2><span>{context}</span></div><button className="dashboard-icon-button" onClick={onClose} aria-label="Fechar painel" autoFocus><X size={20} /></button></header>
        <div className="detail-drawer__body">{children}</div>
        <footer className="detail-drawer__footer"><span>Dados simulados · PULSE Demo</span><button className="dashboard-button" onClick={onClose}>Fechar</button></footer>
      </div>
    </dialog>
  );
}
