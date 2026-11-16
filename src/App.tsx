import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import DashboardLayout from "./layouts/DashboardLayout";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage";
import { useTrackPlatformHistory } from "./hooks/usePlatformBack";
import { RequireDemoAccess } from "./context/DemoSession";

const HomePage = lazy(() => import("./pages/HomePage"));
const MathTreeCostPage = lazy(() => import("./pages/MathTreeCostPage"));

export default function App() {
  useTrackPlatformHistory();
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireDemoAccess />}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/home" element={<Suspense fallback={<div className="dashboard-loading" role="status">Carregando visão executiva...</div>}><HomePage /></Suspense>} />
          <Route path="/home/:module" element={<ModulePlaceholderPage />} />
          <Route path="/math-tree/cost" element={<Suspense fallback={<div className="dashboard-loading" role="status">Carregando árvore de custos...</div>}><MathTreeCostPage /></Suspense>} />
          <Route path="/math-tree/cost/analysis" element={<ModulePlaceholderPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
