import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

const DEMO_ACCESS_KEY = "pulse.demo-access";
type DemoSession = { active: boolean; enterDemo: () => void; leaveDemo: () => void };
const DemoSessionContext = createContext<DemoSession | null>(null);

// DEMO ONLY: this flag controls prototype navigation, not authentication.
// Real authentication, token revocation and authorization must be implemented
// with the future identity provider and backend. Never store credentials here.
export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(() => {
    try { return sessionStorage.getItem(DEMO_ACCESS_KEY) === "active"; }
    catch { return false; }
  });
  const enterDemo = useCallback(() => {
    try { sessionStorage.setItem(DEMO_ACCESS_KEY, "active"); } catch { /* Memory-only demo access when storage is unavailable. */ }
    setActive(true);
  }, []);
  const leaveDemo = useCallback(() => {
    try { sessionStorage.removeItem(DEMO_ACCESS_KEY); } catch { /* The in-memory access is still revoked below. */ }
    setActive(false);
  }, []);
  return <DemoSessionContext.Provider value={{ active, enterDemo, leaveDemo }}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const context = useContext(DemoSessionContext);
  if (!context) throw new Error("DemoSessionProvider is required.");
  return context;
}

export function RequireDemoAccess() {
  const { active } = useDemoSession();
  return active ? <Outlet /> : <Navigate to="/login" replace />;
}
