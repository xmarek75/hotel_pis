import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "./auth/AuthContext";

export const AppLayout = () => {
  const navigate = useNavigate();
  const path = useLocation();
  //const { logout } = useAuth();
  const { logout, username, role } = useAuth();
  
  const title = useMemo(() => {
    switch(path.pathname) {
      case "/reservations": return "Správa rezervací";
      case "/rooms": return "Správa pokojů";
      case "/services": return "Správa služeb";
      case "/customers": return "Správa zákazníků";
      case "/employees": return "Správa zaměstnanců";
      case "/audit-logs": return "Historie změn rezervací";
      default: return "Dashboard - obsazenost";
    }
  }, [path]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-shell__glow" aria-hidden="true" />
      
      <button
        className="btn btn--secondary dashboard-logout-fixed dashboard-logout-user"
        onClick={handleLogout}
        type="button"
      >
        <span>Odhlásit se</span>
        <span className="dashboard-logout-user__meta">
          {username} ({role})
        </span>
      </button>

      <section className="dashboard-wrap">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__left">
            <div className="dashboard-topbar__eyebrow-row">
              <p className="dashboard-topbar__eyebrow">HOTEL PIS</p>
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
              {role?.toUpperCase() === "ADMINISTRATOR" && (
              <button
                className={`dashboard-nav__item ${path.pathname === "/audit-logs" ? "is-active" : ""}`}
                type="button"
                onClick={() => navigate("/audit-logs")}
              >
                Historie změn
              </button>
              )}
            </nav>
          </div>
        </header>
      
        <Outlet />
      
      </section>

    </main>
  );
};
