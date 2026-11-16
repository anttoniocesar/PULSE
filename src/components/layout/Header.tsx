import { useEffect, useRef, useState } from "react";
import { Bell, ChevronRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import UserProfileMenu from "./UserProfileMenu";

export default function Header({ moduleName, onOpenMenu }: { moduleName: string; onOpenMenu: () => void }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notificationsOpen) return;
    const outside = (event: PointerEvent) => {
      if (!notifications.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [notificationsOpen]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__location">
        <button className="dashboard-icon-button mobile-menu-trigger" onClick={onOpenMenu} aria-label="Abrir menu" aria-haspopup="dialog" aria-controls="dashboard-mobile-menu"><Menu size={22} /></button>
        <nav className="dashboard-breadcrumb" aria-label="Caminho da página"><Link to="/home">PULSE</Link><ChevronRight size={13} aria-hidden="true" /><span aria-current="page">{moduleName}</span></nav>
      </div>
      <div className="dashboard-header__actions">
        <span className="dashboard-demo-badge"><span />Ambiente demonstrativo</span>
        <div className="dashboard-notifications" ref={notifications}>
          <button className="dashboard-icon-button" onClick={() => setNotificationsOpen(open => !open)} aria-label="Notificações" aria-expanded={notificationsOpen} aria-controls="notifications-popover"><Bell size={19} /></button>
          {notificationsOpen && (
            <div className="notifications-popover" id="notifications-popover">
              <div><strong>Notificações</strong><button className="dashboard-icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Fechar notificações"><X size={16} /></button></div>
              <p>Este é um ambiente demonstrativo. Consulte as pendências da carteira em Management Attention, no Overview.</p>
              <Link to="/home#management-attention" onClick={() => setNotificationsOpen(false)}>Consultar atenção gerencial <ChevronRight size={14} /></Link>
            </div>
          )}
        </div>
        <UserProfileMenu onOpen={() => setNotificationsOpen(false)} />
      </div>
    </header>
  );
}
