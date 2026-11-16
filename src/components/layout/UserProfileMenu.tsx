import { useEffect, useId, useRef, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDemoSession } from "../../context/DemoSession";

export default function UserProfileMenu({ onOpen }: { onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const exit = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const { leaveDemo } = useDemoSession();

  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => {
    if (!open) return;
    exit.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function showMenu() { onOpen(); setOpen(true); exit.current?.focus(); }
  function leave() {
    // Exit the demonstration; no real identity-provider session exists yet.
    leaveDemo();
    setOpen(false);
    navigate("/login", { replace: true });
  }

  return <div className="user-profile-menu" ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="header-profile" ref={trigger} type="button" aria-label="Perfil do usuário" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => open ? setOpen(false) : showMenu()}
      onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); showMenu(); } }}>
      <span className="header-profile__identity"><strong>Executive</strong><span>Demo Profile</span></span><span className="dashboard-avatar"><UserRound size={19} aria-hidden="true" /></span>
    </button>
    {open && <div className="profile-menu-popover" id={menuId} role="menu" aria-label="Perfil do usuário" onKeyDown={event => {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) { event.preventDefault(); exit.current?.focus(); }
    }}>
      <div className="profile-menu__identity" role="none"><strong>Executive</strong><span>Demo Profile</span><small>Ambiente demonstrativo · sem autenticação real</small></div>
      <button className="profile-menu__exit" role="menuitem" ref={exit} type="button" onClick={leave}><LogOut size={17} aria-hidden="true" />Sair do aplicativo</button>
    </div>}
  </div>;
}
