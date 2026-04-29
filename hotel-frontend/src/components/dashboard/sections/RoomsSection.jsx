import React from "react";

export default function RoomsSection({
  canManageRooms,
  openCreateRoom,
  loading,
  error,
  rooms,
  formatMoney,
  openEditRoom,
}) {
  function roomTypeName(type) {
    if (!type) return "-";
    if (typeof type === "string") return type;
    return type.name ?? "-";
  }

  function roomServiceNames(services) {
    if (!Array.isArray(services) || services.length === 0) return "-";
    return services
      .map((service) => (typeof service === "string" ? service : service?.name))
      .filter(Boolean)
      .join(", ") || "-";
  }

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa pokojů</h3>
          {canManageRooms ? (
            <button className="btn btn--primary btn--compact" type="button" onClick={openCreateRoom}>
              Vytvořit nový pokoj
            </button>
          ) : (
            <span className="rooms-admin__note">Editaci pokojů má dostupnou účet admin.</span>
          )}
        </div>

        {loading ? <p className="panel__text">Načítám pokoje...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}

        {!loading && !error ? (
          <div className="rooms-admin__table-wrap">
            <table className="rooms-admin__table">
              <thead>
                <tr>
                  <th>Číslo</th>
                  <th>Typ</th>
                  <th>Služby</th>
                  <th>Kapacita</th>
                  <th>Cena / noc</th>
                  <th aria-label="Úprava pokoje" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={`manage-${room.id}`}>
                    <td>{room.number}</td>
                    <td>{roomTypeName(room.type)}</td>
                    <td>{roomServiceNames(room.services)}</td>
                    <td>{room.capacity}</td>
                    <td>{formatMoney(room.pricePerNight)}</td>
                    <td>
                      <button
                        className="btn btn--secondary btn--compact"
                        type="button"
                        disabled={!canManageRooms}
                        onClick={() => openEditRoom(room)}
                      >
                        Upravit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}
