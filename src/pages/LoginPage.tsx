import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FlaskConical,
  Layers3,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PulseLogo from "../components/branding/PulseLogo";
import PulseWave from "../components/branding/PulseWave";
import { useDemoSession } from "../context/DemoSession";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const { enterDemo } = useDemoSession();
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSession, setKeepSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validEmail = emailPattern.test(email.trim());
    const hasPassword = password.length > 0;
    setEmailError(validEmail ? "" : "Informe um e-mail válido.");
    setPasswordError(hasPassword ? "" : "Informe sua senha para continuar.");

    if (validEmail && hasPassword) {
      accessDemo();
    } else {
      (validEmail ? passwordInput : emailInput).current?.focus();
    }
  }

  function accessDemo() {
    enterDemo();
    setPassword("");
    setShowPassword(false);
    navigate("/welcome");
  }

  return (
    <main className="login-page">
      <section className="brand-panel" aria-label="Sobre o PULSE">
        <header className="brand-panel__header">
          <PulseLogo />
        </header>

        <div className="brand-panel__content">
          <p className="eyebrow brand-panel__eyebrow">Performance com propósito</p>
          <h1>Transformando performance em valor.</h1>
          <p className="brand-panel__description">
            Estratégia, performance e execução conectadas em uma única plataforma.
          </p>

          <div className="brand-panel__visual">
            <PulseWave />
          </div>

          <ul className="brand-panel__benefits" aria-label="Diferenciais">
            <li>
              <span className="benefit-icon">
                <ShieldCheck size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              Performance orientada a resultados
            </li>
            <li>
              <span className="benefit-icon">
                <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              Gestão integrada da transformação
            </li>
          </ul>
        </div>

        <footer className="brand-panel__footer">
          PULSE © 2026 <span aria-hidden="true">·</span> Concept Preview
        </footer>
      </section>

      <section className="auth-panel" aria-labelledby="login-title">
        <div className="environment-badge">
          <FlaskConical size={15} strokeWidth={1.8} aria-hidden="true" />
          Ambiente demonstrativo
        </div>

        <div className="auth-content">
          <div className="auth-heading">
            <p className="eyebrow auth-heading__eyebrow">Acesso corporativo</p>
            <h2 id="login-title">Bem-vindo ao PULSE</h2>
            <p>Acesse sua plataforma de transformação.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">E-mail corporativo</label>
              <input
                autoComplete="email"
                aria-describedby={emailError ? "email-error" : undefined}
                aria-invalid={Boolean(emailError)}
                id="email"
                ref={emailInput}
                required
                autoCapitalize="none"
                spellCheck={false}
                name="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="nome@empresa.com"
                type="email"
                value={email}
              />
              {emailError && (
                <span className="field-error" id="email-error" role="alert">
                  {emailError}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="password">Senha</label>
              <div className="password-input">
                <input
                  autoComplete="current-password"
                  aria-describedby={passwordError ? "password-error" : undefined}
                  aria-invalid={Boolean(passwordError)}
                  id="password"
                  ref={passwordInput}
                  required
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Digite sua senha"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordError && (
                <span className="field-error" id="password-error" role="alert">
                  {passwordError}
                </span>
              )}
            </div>

            <label className="session-option">
              <input
                checked={keepSession}
                aria-describedby="demo-caption"
                onChange={(event) => setKeepSession(event.target.checked)}
                type="checkbox"
              />
              <span className="custom-checkbox" aria-hidden="true">
                <Check size={13} strokeWidth={2.5} />
              </span>
              <span>Manter sessão neste dispositivo</span>
            </label>

            <button className="button button--primary" type="submit">
              Entrar na plataforma
              <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>

          <div className="form-divider" aria-label="ou">
            <span />
            <span className="form-divider__label">OU</span>
            <span />
          </div>

          <button
            className="button button--secondary"
            onClick={accessDemo}
            type="button"
          >
            Acessar demonstração
          </button>

          <p className="demo-caption" id="demo-caption">
            Protótipo demonstrativo <span aria-hidden="true">·</span> Sem
            autenticação real
          </p>
        </div>

        <footer className="auth-panel__footer">
          PULSE <span aria-hidden="true">·</span> Version 0.1{" "}
          <span aria-hidden="true">·</span> Prototype
        </footer>
      </section>
    </main>
  );
}
