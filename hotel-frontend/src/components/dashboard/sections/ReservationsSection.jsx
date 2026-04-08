import React from "react";

export default function ReservationsSection({
  loading,
  error,
  reservationFilters,
  updateReservationFilter,
  RESERVATION_STATUSES,
  PAYMENT_STATUSES,
  reservationSort,
  setReservationSort,
  RESERVATION_SORT_FIELDS,
  filteredReservations,
  pagedReservations,
  reservationPage,
  setReservationPage,
  reservationTotalPages,
  pageSize,
  reservations,
  resetReservationFilters,
  openReservationDetail,
  formatDate,
  formatMoney,
}) {
  const pageStart = filteredReservations.length === 0 ? 0 : (reservationPage - 1) * pageSize + 1;
  const pageEnd = Math.min(reservationPage * pageSize, filteredReservations.length);

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa rezervací</h3>
          <span className="rooms-admin__note">Kliknutím na řádek otevřeš detail rezervace.</span>
        </div>

        {loading ? <p className="panel__text">Načítám rezervace...</p> : null}
        {error ? <p className="status status--error">{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="reservation-filters">
              <div className="reservation-filters__grid">
                <label>
                  <span>Hledat</span>
                  <input
                    type="text"
                    value={reservationFilters.search}
                    onChange={(e) => updateReservationFilter("search", e.target.value)}
                    placeholder="ID, zakaznik, pokoj..."
                  />
                </label>
                <label>
                  <span>Stav rezervace</span>
                  <select
                    value={reservationFilters.status}
                    onChange={(e) => updateReservationFilter("status", e.target.value)}
                  >
                    <option value="ALL">Vsechny</option>
                    {RESERVATION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Stav platby</span>
                  <select
                    value={reservationFilters.paymentStatus}
                    onChange={(e) => updateReservationFilter("paymentStatus", e.target.value)}
                  >
                    <option value="ALL">Vsechny</option>
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Pokoj</span>
                  <input
                    type="text"
                    value={reservationFilters.roomNumber}
                    onChange={(e) => updateReservationFilter("roomNumber", e.target.value)}
                    placeholder="napr. 101"
                  />
                </label>
                <label>
                  <span>Od (check-in)</span>
                  <input
                    type="date"
                    value={reservationFilters.fromDate}
                    onChange={(e) => updateReservationFilter("fromDate", e.target.value)}
                  />
                </label>
                <label>
                  <span>Do (check-out)</span>
                  <input
                    type="date"
                    value={reservationFilters.toDate}
                    onChange={(e) => updateReservationFilter("toDate", e.target.value)}
                  />
                </label>
                <label>
                  <span>Seradit podle</span>
                  <select
                    value={reservationSort.field}
                    onChange={(e) => setReservationSort((prev) => ({ ...prev, field: e.target.value }))}
                  >
                    {RESERVATION_SORT_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Smer</span>
                  <select
                    value={reservationSort.direction}
                    onChange={(e) => setReservationSort((prev) => ({ ...prev, direction: e.target.value }))}
                  >
                    <option value="desc">Sestupne</option>
                    <option value="asc">Vzestupne</option>
                  </select>
                </label>
              </div>
              <div className="reservation-filters__actions">
                <span className="rooms-admin__note">
                  Zobrazeno {pageStart}-{pageEnd} z {filteredReservations.length} (celkem {reservations.length}).
                </span>
                <button className="btn btn--secondary btn--compact" type="button" onClick={resetReservationFilters}>
                  Reset filtru
                </button>
              </div>
            </div>
            <div className="rooms-admin__table-wrap">
              <table className="rooms-admin__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pokoj</th>
                    <th>Zákazník</th>
                    <th>Od</th>
                    <th>Do</th>
                    <th>Stav</th>
                    <th>Platba</th>
                    <th>Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedReservations.map((reservation) => (
                    <tr
                      key={`manage-res-${reservation.id}`}
                      className="rooms-admin__row--clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => openReservationDetail(reservation)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openReservationDetail(reservation);
                        }
                      }}
                      title="Otevřít detail rezervace"
                    >
                      <td>{reservation.id}</td>
                      <td>{reservation.roomNumber ?? "-"}</td>
                      <td>{reservation.customerName ?? "-"}</td>
                      <td>{formatDate(reservation.checkInDate)}</td>
                      <td>{formatDate(reservation.checkOutDate)}</td>
                      <td>{reservation.status ?? "-"}</td>
                      <td>{reservation.paymentStatus ?? "-"}</td>
                      <td>{formatMoney(reservation.totalPrice)}</td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td colSpan={8}>Filtru neodpovida zadna rezervace.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {filteredReservations.length > 0 ? (
              <div className="reservation-pagination">
                <button
                  className="btn btn--secondary btn--compact"
                  type="button"
                  onClick={() => setReservationPage((prev) => Math.max(1, prev - 1))}
                  disabled={reservationPage <= 1}
                >
                  Předchozí
                </button>
                <span className="reservation-pagination__info">
                  Strana {reservationPage} / {reservationTotalPages}
                </span>
                <button
                  className="btn btn--secondary btn--compact"
                  type="button"
                  onClick={() => setReservationPage((prev) => Math.min(reservationTotalPages, prev + 1))}
                  disabled={reservationPage >= reservationTotalPages}
                >
                  Další
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </section>
  );
}
