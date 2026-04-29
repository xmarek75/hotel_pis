import React from "react";

export default function ServicesSection({
  canManageServices,
  openCreateService,
  loading,
  error,
  serviceStatus,
  services,
  roomServices,
  formatMoney,
  openEditService,
  deleteService,
}) {
  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa služeb</h3>
          {!canManageServices ? (
            <span className="rooms-admin__note">Správu služeb má dostupnou admin nebo manager účet.</span>
          ) : null}
        </div>

        {loading ? <p className="panel__text">Načítám služby...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
        {serviceStatus.message ? (
          <p className={`status status--${serviceStatus.type === "idle" ? "neutral" : serviceStatus.type}`}>
            {serviceStatus.message}
          </p>
        ) : null}

        {!loading && !error ? (
          <div className="services-admin-grid">
            <section className="services-admin-card">
              <div className="rooms-admin__head">
                <h3>Služby hotelu</h3>
                {canManageServices ? (
                  <button
                    className="btn btn--primary btn--compact"
                    type="button"
                    onClick={() => openCreateService("hotel")}
                  >
                    Přidat službu
                  </button>
                ) : null}
              </div>

              <div className="rooms-admin__table-wrap">
                <table className="rooms-admin__table">
                  <thead>
                    <tr>
                      <th>Název</th>
                      <th>Popis</th>
                      <th>Cena</th>
                      <th aria-label="Akce" />
                    </tr>
                  </thead>
                  <tbody>
                    {services.length === 0 ? (
                      <tr>
                        <td colSpan={4}>Žádné hotelové služby.</td>
                      </tr>
                    ) : (
                      services.map((service) => (
                        <tr key={`manage-service-${service.id}`}>
                          <td>{service.name ?? "-"}</td>
                          <td>{service.description ?? "-"}</td>
                          <td>{formatMoney(service.price)}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="btn btn--secondary btn--compact"
                                type="button"
                                disabled={!canManageServices}
                                onClick={() => openEditService("hotel", service)}
                              >
                                Upravit
                              </button>
                              <button
                                className="btn btn--danger btn--compact"
                                type="button"
                                disabled={!canManageServices}
                                onClick={() => deleteService("hotel", service)}
                              >
                                Smazat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="services-admin-card">
              <div className="rooms-admin__head">
                <h3>Služby pokoje</h3>
                {canManageServices ? (
                  <button
                    className="btn btn--primary btn--compact"
                    type="button"
                    onClick={() => openCreateService("room")}
                  >
                    Přidat službu
                  </button>
                ) : null}
              </div>

              <div className="rooms-admin__table-wrap">
                <table className="rooms-admin__table">
                  <thead>
                    <tr>
                      <th>Název</th>
                      <th>Popis</th>
                      <th aria-label="Akce" />
                    </tr>
                  </thead>
                  <tbody>
                    {roomServices.length === 0 ? (
                      <tr>
                        <td colSpan={3}>Žádné pokojové služby.</td>
                      </tr>
                    ) : (
                      roomServices.map((service) => (
                        <tr key={`manage-room-service-${service.id}`}>
                          <td>{service.name ?? "-"}</td>
                          <td>{service.description ?? "-"}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                className="btn btn--secondary btn--compact"
                                type="button"
                                disabled={!canManageServices}
                                onClick={() => openEditService("room", service)}
                              >
                                Upravit
                              </button>
                              <button
                                className="btn btn--danger btn--compact"
                                type="button"
                                disabled={!canManageServices}
                                onClick={() => deleteService("room", service)}
                              >
                                Smazat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </section>
  );
}
