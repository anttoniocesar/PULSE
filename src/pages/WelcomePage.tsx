import { ChartNoAxesColumnIncreasing, ChevronRight, Settings, Target } from "lucide-react";
import PulseLogo from "../components/branding/PulseLogo";
import PulseWaves from "../components/branding/PulseWaves";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import useWelcomeCountdown from "../hooks/useWelcomeCountdown";
import "../styles/welcome.css";

export default function WelcomePage() {
  const { secondsRemaining, isLeaving, skip } = useWelcomeCountdown();

  return (
    <main className={`welcome-screen${isLeaving ? " welcome-screen--leaving" : ""}`}>
      <section className="welcome-intro" aria-labelledby="welcome-title">
        <header className="welcome-intro__brand">
          <PulseLogo variant="dark" />
        </header>
        <div className="welcome-intro__content">
          <span className="welcome-intro__accent" aria-hidden="true" />
          <h1 id="welcome-title">Bem-vindo.</h1>
          <p className="welcome-intro__subtitle">Transformando performance em valor.</p>
          <ul className="welcome-intro__features">
            <li>
              <span><ChartNoAxesColumnIncreasing size={21} aria-hidden="true" /></span>
              Conecte estratégia e execução
            </li>
            <li>
              <span><Settings size={21} aria-hidden="true" /></span>
              Acompanhe a performance
            </li>
            <li>
              <span><Target size={21} aria-hidden="true" /></span>
              Gere resultados sustentáveis
            </li>
          </ul>
        </div>
        <div className="welcome-intro__waves"><PulseWaves /></div>
        <footer className="welcome-intro__footer">PULSE Platform Demo</footer>
      </section>
      <section className="welcome-landscape" aria-label="Entrada na plataforma">
        <img
          className="welcome-landscape__image"
          src="/images/pulse-landscape.png"
          alt="Lago sereno refletindo montanhas e florestas, iluminado pelo sol entre as árvores."
          fetchPriority="high"
        />
        <button className="welcome-skip" onClick={skip} disabled={isLeaving} type="button">
          Pular <ChevronRight size={16} aria-hidden="true" />
        </button>
        <div className="welcome-progress" role="status" aria-live="polite" aria-atomic="true">
          <LoadingSpinner />
          <div className="welcome-progress__text">
            <p>{isLeaving ? "Abrindo a Home..." : "Entrando na plataforma..."}</p>
            <p>
              {isLeaving
                ? "Tudo pronto. Vamos começar."
                : `Aguarde, você será redirecionado em ${secondsRemaining} ${secondsRemaining === 1 ? "segundo" : "segundos"}.`}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
