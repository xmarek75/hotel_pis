import React from "react";

export default function DashboardHeader({ viewTitle, activeView, setActiveView }) {
  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <div className="dashboard-topbar__eyebrow-row">
          <p className="dashboard-topbar__eyebrow">HOTEL PIS</p>
          <span className="dashboard-topbar__pill">
            <span className="dashboard-topbar__pill-dot" />
            Systém online
          </span>
        </div>
        <h1 className="dashboard-topbar__title">{viewTitle}</h1>
        <nav className="dashboard-nav" aria-label="Přepnutí sekce">
          <button
            className={`dashboard-nav__item ${activeView === "occupancy" ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveView("occupancy")}
          >
            Dashboard
          </button>
          <button
            className={`dashboard-nav__item ${activeView === "reservations" ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveView("reservations")}
          >
            Správa rezervací
          </button>
          <button
            className={`dashboard-nav__item ${activeView === "rooms" ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveView("rooms")}
          >
            Správa pokojů
          </button>
          <button
            className={`dashboard-nav__item ${activeView === "services" ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveView("services")}
          >
            Správa služeb
          </button>
          <button
            className={`dashboard-nav__item ${activeView === "employees" ? "is-active" : ""}`}
            type="button"
            onClick={() => setActiveView("employees")}
          >
            Správa zaměstnanců
          </button>
        </nav>
      </div>
    </header>
  );
}
