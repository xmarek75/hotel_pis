import React from "react";

export default function DashboardHeader({ viewTitle, activeView, setActiveView }) {
  return (
    <aside className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <div className="dashboard-topbar__eyebrow-row">
          <p className="dashboard-topbar__eyebrow">HOTEL MANAGMENT</p>

        </div>
        
      </div>

      <div className="dashboard-topbar__section-label"></div>
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
          Rezervace
        </button>
        <button
          className={`dashboard-nav__item ${activeView === "rooms" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("rooms")}
        >
          Pokoje
        </button>
        <button
          className={`dashboard-nav__item ${activeView === "services" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("services")}
        >
           Služby
        </button>
        <button
          className={`dashboard-nav__item ${activeView === "customers" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("customers")}
        >
          Zákazníci
        </button>
        <button
          className={`dashboard-nav__item ${activeView === "employees" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("employees")}
        >
          Zaměstnanci
        </button>
      </nav>


    </aside>
  );
}
