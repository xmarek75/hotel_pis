import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "./auth/AuthContext";

export const AppLayout = () => {
  const navigate = useNavigate();
  const path = useLocation();
  const { logout } = useAuth();

  const title = useMemo(() => {
    switch(path.pathname) {
      case "/reservations": return "Správa rezervací";
      case "/rooms": return "Správa pokojů";
      case "/services": return "Správa služeb";
      case "/customers": return "Správa zákazníků";
      case "/employees": return "Správa zaměstnanců";
      default: return "Dashboard-obsazenost";
    }
  }, [path]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-shell__glow" aria-hidden="true" />
      <button className="btn btn--secondary dashboard-logout-fixed" onClick={handleLogout} type="button">
        Odhlásit
      </button>

      <section className="dashboard-wrap">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <div className="dashboard-topbar__eyebrow-row">
              <p className="dashboard-topbar__eyebrow">HOTEL PIS</p>
              <span className="dashboard-topbar__pill">
                <span className="dashboard-topbar__pill-dot" />
                Systém online
              </span>
            </div>
            <h1 className="dashboard-topbar__title">{title}</h1>
            <nav className="dashboard-nav" aria-label="Přepnutí sekce">
              <button
                className={`dashboard-nav__item ${path.pathname === "/dashboard" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/")}
              >
                Dashboard
              </button>
              <button
                className={`dashboard-nav__item ${path.pathname === "/reservations" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/reservations")}
              >
                Správa rezervací
              </button>
              <button
                className={`dashboard-nav__item ${path.pathname === "/rooms" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/rooms")}
              >
                Správa pokojů
              </button>
              <button
                className={`dashboard-nav__item ${path.pathname === "/services" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/services")}
              >
                Správa služeb
              </button>
              <button
                className={`dashboard-nav__item ${path.pathname === "/customers" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/customers")}
              >
                Správa zákazníků
              </button>
              <button
                className={`dashboard-nav__item ${path.pathname === "/employees" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/employees")}
              >
                Správa zaměstnanců
              </button>
            </nav>
          </div>
        </header>
      
        <Outlet />
      
      </section>

    </main>
  );
};
