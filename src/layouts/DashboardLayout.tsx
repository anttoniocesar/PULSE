import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { findNavigationItem, navigation } from "../components/layout/navigation";
import "../styles/dashboard.css";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLElement>(null);
  const location = useLocation();
  const current = findNavigationItem(location.pathname) ?? navigation[0];

  useEffect(() => {
    if (!mobileOpen) return;
    const dialog = mobileDialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      trigger?.focus({ preventScroll: true });
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (location.hash !== "#management-attention") content.current?.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className={`dashboard-shell${collapsed ? " dashboard-shell--collapsed" : ""}`}>
      <a className="dashboard-skip-link" href="#dashboard-content">Ir para o conteúdo</a>
      <div className="desktop-sidebar"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} /></div>
      <dialog ref={mobileDialog} className="mobile-sidebar" id="dashboard-mobile-menu" aria-label="Navegação PULSE" onCancel={() => setMobileOpen(false)} onClick={event => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </dialog>
      <div className="dashboard-workspace">
        <Header moduleName={current.label} onOpenMenu={() => setMobileOpen(true)} />
        <main ref={content} id="dashboard-content" className="dashboard-content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  );
}
