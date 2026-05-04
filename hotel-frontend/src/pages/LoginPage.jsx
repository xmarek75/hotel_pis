import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Waves } from "../components/ui/wave-background";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.DEV ? "/api" : "/hotel/api";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function testLogin({ username, password }) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (res.status === 401) throw new Error("Neplatné přihlašovací údaje (401).");
  if (res.status === 403) throw new Error("Nemáš oprávnění pro tento účet (403).");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json();
}

function StatusMessage({ status }) {
  if (!status.message) return null;

  return (
    <div className={`status status--${status.type === "idle" ? "neutral" : status.type}`}>
      {status.message}
    </div>
  );
}

export default function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const redirectTo = location.state?.from || "/dashboard";

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && status.type !== "loading",
    [username, password, status.type]
  );

  if (isAuthed) {
    return <Navigate to={redirectTo} replace />;
  }

  function applyDemoCredentials(user, pass) {
    setUsername(user);
    setPassword(pass);
    setStatus({ type: "idle", message: "" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ type: "loading", message: "Ověřuji přihlášení..." });

    try {
      const trimmedUsername = username.trim();
      const auth = await testLogin({ username: trimmedUsername, password });
      login({ username: auth.username ?? trimmedUsername, token: auth.token, role: auth.role });
      setStatus({ type: "success", message: "Přihlášení proběhlo úspěšně." });
      navigate(redirectTo, { replace: true });
      queryClient.invalidateQueries();
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Chyba přihlášení." });
    }
  }

  return (
    <main className="app-shell">
      <Waves className="login-waves-bg" strokeColor="rgba(23, 63, 109, 0.32)" pointerSize={0.35} />
      <div className="bg-orb bg-orb--left" aria-hidden="true" />
      <div className="bg-orb bg-orb--right" aria-hidden="true" />

      <section className="app-layout" aria-label="Hotel administration login">
        <aside className="hero-panel">
          <div className="hero-panel__badge">Hotel Management</div>
          <div className="hero-panel__signals" aria-hidden="true">
            <span className="hero-panel__signal hero-panel__signal--ok" />
            <span className="hero-panel__signal hero-panel__signal--ok" />
            <span className="hero-panel__signal hero-panel__signal--warn" />
          </div>
          <h1 className="hero-panel__title">Hotelový informační systém</h1>
          <p className="hero-panel__text">
            Přihlášení do interního systému pro správu rezervací, pokojů, zákazníků a zaměstnanců.
          </p>

          <div className="hero-grid">
            <div className="hero-tile">
              <span className="hero-tile__label">API</span>
              <strong className="hero-tile__value">/hotel/api</strong>
            </div>
            <div className="hero-tile">
              <span className="hero-tile__label">Autentizace</span>
              <strong className="hero-tile__value">JWT</strong>
            </div>
            <div className="hero-tile">
              <span className="hero-tile__label">Backend</span>
              <strong className="hero-tile__value">Open Liberty</strong>
            </div>
            <div className="hero-tile">
              <span className="hero-tile__label">Databáze</span>
              <strong className="hero-tile__value">PostgreSQL</strong>
            </div>
          </div>

          <section className="tech-stack" aria-label="Použitý technologický stack">
            <h2 className="tech-stack__title">Tech Stack (aktuálně)</h2>
            <ul className="tech-stack__list">
              <li>
                <span className="tech-stack__label">Backend:</span>
                Java 17 + Open Liberty (Jakarta EE, JAX-RS, CDI, JPA/EclipseLink)
              </li>
              <li>
                <span className="tech-stack__label">Frontend:</span>
                React (Vite) jako samostatná klientská aplikace
              </li>
              <li>
                <span className="tech-stack__label">Databáze:</span>
                PostgreSQL (JPA persistence unit `hotelPU`)
              </li>
              <li>
                <span className="tech-stack__label">API:</span>
                REST endpointy pod `/hotel/api` (proxy přes Vite na `/api`)
              </li>
              <li>
                <span className="tech-stack__label">Bezpečnost:</span>
                Login endpoint + JWT Bearer token + role (`administrator`, `RECEPTIONIST`)
              </li>
              <li>
                <span className="tech-stack__label">Infrastruktura:</span>
                Docker Compose (PostgreSQL + pgAdmin)
              </li>
            </ul>
          </section>
        </aside>

        <section className="auth-card" aria-live="polite">
          <div className="auth-card__header">
            <p className="auth-card__eyebrow">Přihlášení</p>
            <h2 className="auth-card__title">Vstup do administrace</h2>
            <p className="auth-card__subtitle">
              Použijte účet zaměstnance uložený v databázi.
            </p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-quick-actions">
              <button
                className="btn btn--secondary btn--compact"
                type="button"
                onClick={() => applyDemoCredentials("admin", "admin123")}
              >
                Demo Admin
              </button>
              <button
                className="btn btn--secondary btn--compact"
                type="button"
                onClick={() => applyDemoCredentials("manager", "manager123")}
              >
                Demo Manažer
              </button>
              <button
                className="btn btn--secondary btn--compact"
                type="button"
                onClick={() => applyDemoCredentials("reception", "reception123")}
              >
                Demo Recepce
              </button>
            </div>

            <label className="field">
              <span className="field__label">Uživatelské jméno</span>
              <input
                className="field__input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </label>

            <label className="field">
              <span className="field__label">Heslo</span>
              <div className="field__password-wrap">
                <input
                  className="field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="admin123"
                  required
                />
                <button
                  className="field__toggle"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="field__toggle-icon" aria-hidden="true">
                      <path
                        d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-0.69 1.55-1.79 2.95-3.17 4.07M6.1 6.1C4.04 7.44 2.45 9.54 1 12c1.73 3.89 6 7 11 7 1.73 0 3.37-.37 4.84-1.03"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="field__toggle-icon" aria-hidden="true">
                      <path
                        d="M1 12c1.73-3.89 6-7 11-7s9.27 3.11 11 7c-1.73 3.89-6 7-11 7S2.73 15.89 1 12zm11 3a3 3 0 100-6 3 3 0 000 6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {status.type === "loading" ? "Přihlašuji..." : "Přihlásit"}
            </button>

            <div className="credentials-hint" role="note">
              <div>
                <span className="credentials-hint__label">Admin</span>
                <code>admin / admin123</code>
              </div>
              <div>
                <span className="credentials-hint__label">Manažer</span>
                <code>manager / manager123</code>
              </div>
              <div>
                <span className="credentials-hint__label">Recepce</span>
                <code>reception / reception123</code>
              </div>
            </div>
          </form>

          <StatusMessage status={status} />
        </section>
      </section>
    </main>
  );
}
