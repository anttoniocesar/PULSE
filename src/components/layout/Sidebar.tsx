import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronsLeft, ChevronsRight, UserRound, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import PulseLogo from "../branding/PulseLogo";
import { navigation, type NavigationItem } from "./navigation";

type Props = { collapsed?: boolean; onToggle?: () => void; onClose?: () => void };

export default function Sidebar({ collapsed = false, onToggle, onClose }: Props) {
  const { pathname } = useLocation();
  const submenuId = useId();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(navigation.filter(item => item.children?.some(child => child.path === pathname)).map(item => item.path)));
  useEffect(() => {
    const activeParent = navigation.find(item => item.children?.some(child => child.path === pathname));
    if (activeParent) setExpandedGroups(previous => new Set(previous).add(activeParent.path));
  }, [pathname]);
  function toggleGroup(path: string) {
    setExpandedGroups(previous => { const next = new Set(previous); if (next.has(path)) next.delete(path); else next.add(path); return next; });
  }
  function renderLink({ label, path, icon: Icon }: NavigationItem, nested = false) {
    return <NavLink key={path} to={path} end title={collapsed ? label : undefined} onClick={onClose} className={({ isActive }) => `dashboard-nav-link${isActive ? " dashboard-nav-link--active" : ""}`}>
      <Icon size={nested ? 17 : 19} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span>
    </NavLink>;
  }
  return (
    <aside className={`dashboard-sidebar${collapsed ? " dashboard-sidebar--collapsed" : ""}`} aria-label="Menu principal">
      <div className="dashboard-sidebar__brand">
        <PulseLogo />
        {onClose && <button className="dashboard-icon-button sidebar-close" onClick={onClose} aria-label="Fechar menu"><X size={20} /></button>}
      </div>
      <p className="dashboard-sidebar__label">WORKSPACE</p>
      <nav aria-label="Módulos PULSE">
        {navigation.map(item => {
          if (!item.children) return renderLink(item);
          const childActive = item.children.some(child => child.path === pathname);
          const expanded = childActive || expandedGroups.has(item.path);
          return <div className="dashboard-nav-group" key={item.path}>
            <div className={`dashboard-nav-row${childActive ? " dashboard-nav-row--child-active" : ""}`}>
              {renderLink(item)}
              <button className="dashboard-submenu-toggle" type="button" aria-label={`${expanded ? "Recolher" : "Expandir"} submenu ${item.label}`} aria-expanded={expanded} aria-controls={submenuId} disabled={childActive} title={childActive ? "Submenu mantido aberto enquanto um subitem está ativo" : `${expanded ? "Recolher" : "Expandir"} ${item.label}`} onClick={() => toggleGroup(item.path)}><ChevronDown size={15} aria-hidden="true" /></button>
            </div>
            <div id={submenuId} className={`dashboard-submenu${expanded ? " dashboard-submenu--open" : ""}`} aria-hidden={!expanded} inert={!expanded}>
              <div className="dashboard-submenu__links">{item.children.map(child => renderLink(child, true))}</div>
            </div>
          </div>;
        })}
      </nav>
      <div className="dashboard-sidebar__bottom">
        {onToggle && (
          <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"} aria-expanded={!collapsed}>
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            <span>Recolher menu</span>
          </button>
        )}
        <div className="sidebar-profile">
          <span className="dashboard-avatar"><UserRound size={19} aria-hidden="true" /></span>
          <div><strong>Executive</strong><span>Demo Profile</span></div>
          <span className="sidebar-profile__dot" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
