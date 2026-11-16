import { ArrowLeft, Clock3 } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { findNavigationItem } from "../components/layout/navigation";

export default function ModulePlaceholderPage() {
  const { pathname } = useLocation();
  const module = findNavigationItem(pathname);
  if (!module) return <Navigate to="/home" replace />;
  const Icon = module.icon;
  return (
    <section className="module-placeholder">
      <span className="module-placeholder__icon"><Icon size={30} strokeWidth={1.5} /></span>
      <p className="dashboard-eyebrow"><Clock3 size={13} /> PRÓXIMA ETAPA</p>
      <h1>{module.label}</h1>
      <p>Módulo em desenvolvimento — próxima etapa.</p>
      <Link className="dashboard-button" to="/home"><ArrowLeft size={16} />Voltar ao Overview</Link>
    </section>
  );
}
