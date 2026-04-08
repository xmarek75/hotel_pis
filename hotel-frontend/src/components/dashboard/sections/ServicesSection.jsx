import React from "react";

export default function ServicesSection({
  canManageServices,
  openCreateService,
  loading,
  error,
  serviceStatus,
  services,
  formatMoney,
  openEditService,
  deleteService,
}) {
  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa služeb</h3>
          {canManageServices ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={openCreateService}>
              Přidat službu
            </button>
          ) : (
            <span className="rooms-admin__note">Správu služeb má dostupnou admin nebo manager účet.</span>
          )}
        </div>

        {loading ? <p className="panel__text">Načítám služby...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}
        {serviceStatus.message ? (
          <p className={`status status--${serviceStatus.type === "idle" ? "neutral" : serviceStatus.type}`}>
            {serviceStatus.message}
          </p>
        ) : null}

        {!loading && !error ? (
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
                    <td colSpan={4}>Žádné služby.</td>
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
                            onClick={() => openEditService(service)}
                          >
                            Upravit
                          </button>
                          <button
                            className="btn btn--danger btn--compact"
                            type="button"
                            disabled={!canManageServices}
                            onClick={() => deleteService(service)}
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
        ) : null}
      </section>
    </section>
  );
}
