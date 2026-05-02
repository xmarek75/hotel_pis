import React from "react";
import {
  calculateAgeFromDate,
  formatDate,
  formatDateTime,
  formatMoney,
  normalizeServiceSelections,
} from "../dashboardUtils";

export default function ReservationDetailModal({
  selectedReservation,
  closeReservationDetail,
  reservationEditMode,
  setReservationEditMode,
  reservationEditForm,
  updateReservationEditForm,
  reservationActionStatus,
  services,
  toggleReservationService,
  updateReservationServiceQuantity,
  RESERVATION_STATUSES,
  PAYMENT_STATUSES,
  submitReservationUpdate,
  submitReservationStatusUpdate,
  cancelReservation,
  setReservationActionStatus,
}) {
  if (!selectedReservation) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeReservationDetail}>
      <section
        className="reservation-modal"
        onClick={(e) => e.stopPropagation()}
        aria-label="Detail rezervace"
      >
        <header className="reservation-modal__head">
          <h3>Detail rezervace #{selectedReservation.id}</h3>
          <button
            className="btn btn--secondary btn--compact"
            type="button"
            onClick={closeReservationDetail}
          >
            Zavřít
          </button>
        </header>

        {reservationEditMode ? (
          <>
            <div className="reservation-form-grid">
              <label>
                <span>Začátek rezervace</span>
                <input
                  type="date"
                  value={reservationEditForm.checkInDate}
                  onChange={(e) => updateReservationEditForm("checkInDate", e.target.value)}
                />
              </label>
              <label>
                <span>Konec rezervace</span>
                <input
                  type="date"
                  value={reservationEditForm.checkOutDate}
                  onChange={(e) => updateReservationEditForm("checkOutDate", e.target.value)}
                />
              </label>
              <label>
                <span>Počet hostů</span>
                <input
                  type="number"
                  min={1}
                  max={selectedReservation.roomCapacity ?? 50}
                  value={reservationEditForm.numberOfGuests}
                  onChange={(e) => updateReservationEditForm("numberOfGuests", e.target.value)}
                />
              </label>
              <label>
                <span>Stav rezervace</span>
                <select
                  value={reservationEditForm.status}
                  onChange={(e) => updateReservationEditForm("status", e.target.value)}
                >
                  {RESERVATION_STATUSES.map((statusValue) => (
                    <option key={statusValue} value={statusValue}>
                      {statusValue}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Stav platby</span>
                <select
                  value={reservationEditForm.paymentStatus}
                  onChange={(e) => updateReservationEditForm("paymentStatus", e.target.value)}
                >
                  {PAYMENT_STATUSES.map((statusValue) => (
                    <option key={statusValue} value={statusValue}>
                      {statusValue}
                    </option>
                  ))}
                </select>
              </label>
              <label className="reservation-form-grid__full">
                <span>Speciální požadavky</span>
                <textarea
                  rows={2}
                  value={reservationEditForm.specialRequests}
                  onChange={(e) => updateReservationEditForm("specialRequests", e.target.value)}
                />
              </label>
              <fieldset className="reservation-customer-box reservation-form-grid__full">
                <legend>Doplňkové služby</legend>
                {services.length === 0 ? (
                  <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
                ) : (
                  <div className="new-customer-grid">
                    {services.map((service) => {
                      const selectedItem = normalizeServiceSelections(reservationEditForm.serviceItems).find(
                        (item) => item.serviceId === String(service.id)
                      );
                      return (
                        <label key={`edit-service-${service.id}`}>
                          <span>
                            <input
                              type="checkbox"
                              checked={!!selectedItem}
                              onChange={(e) => toggleReservationService(service.id, e.target.checked)}
                            />
                            {" "}
                            {service.name} ({formatMoney(service.price)})
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={selectedItem?.quantity ?? 1}
                            disabled={!selectedItem}
                            onChange={(e) => updateReservationServiceQuantity(service.id, e.target.value)}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            </div>

            {reservationActionStatus.message ? (
              <p
                className={`status status--${
                  reservationActionStatus.type === "idle" ? "neutral" : reservationActionStatus.type
                }`}
              >
                {reservationActionStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => {
                  setReservationEditMode(false);
                  setReservationActionStatus({ type: "idle", message: "" });
                }}
              >
                Zpět
              </button>
              <button className="btn btn--primary" type="button" onClick={submitReservationUpdate}>
                Uložit změny
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="reservation-detail-sections">
              <section className="reservation-detail-section">
                <div className="reservation-detail-grid">
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Vytvoření rezervace</span>
                    <span>{formatDateTime(selectedReservation.createdAt)}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label"> </span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Od</span>
                    <span>{formatDate(selectedReservation.checkInDate)}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Do</span>
                    <span>{formatDate(selectedReservation.checkOutDate)}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Stav rezervace</span>
                    <select
                      value={reservationEditForm.status}
                      onChange={(e) => updateReservationEditForm("status", e.target.value)}
                    >
                      {RESERVATION_STATUSES.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Počet hostů</span>
                    <span>{selectedReservation.numberOfGuests ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Specialní požadavky</span>
                    <span>{selectedReservation.specialRequests || "-"}</span>
                  </div>
                </div>
              </section>

              <section className="reservation-detail-section">
                <div className="reservation-detail-grid">
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Stav platby</span>
                    <select
                      value={reservationEditForm.paymentStatus}
                      onChange={(e) => updateReservationEditForm("paymentStatus", e.target.value)}
                    >
                      {PAYMENT_STATUSES.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Cena celkem</span>
                    <span>{formatMoney(selectedReservation.totalPrice)}</span>
                  </div>
                </div>
              </section>

              <section className="reservation-detail-section">
                <h4>Služby v rezervaci</h4>
                <div className="reservation-detail-grid">
                  {Array.isArray(selectedReservation.serviceItems) && selectedReservation.serviceItems.length > 0 ? (
                    selectedReservation.serviceItems.map((item, index) => (
                      <div className="reservation-detail-item" key={`reservation-service-${item.id ?? index}`}>
                        <span className="reservation-detail-item__label">
                          {item.service?.name ?? `Služba #${item.service?.id ?? index + 1}`}
                        </span>
                        <span>
                          {item.quantity ?? 1}x {formatMoney(item.priceAtTime)} = {formatMoney(item.totalPrice)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="reservation-detail-item">
                      <span className="reservation-detail-item__label">Služby</span>
                      <span>Žádné doplňkové služby.</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="reservation-detail-section">
                <div className="reservation-detail-grid">
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Pokoj</span>
                    <span>{selectedReservation.roomNumber ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Typ pokoje</span>
                    <span>{selectedReservation.roomType ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Kapacita pokoje</span>
                    <span>{selectedReservation.roomCapacity ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Cena za noc</span>
                    <span>{formatMoney(selectedReservation.roomPricePerNight)}</span>
                  </div>
                </div>
              </section>

              <section className="reservation-detail-section">
                <div className="reservation-detail-grid">
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Jméno zákazníka</span>
                    <span>{selectedReservation.customerName ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">E-mail</span>
                    <span>{selectedReservation.customerEmail ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Telefon</span>
                    <span>{selectedReservation.customerPhone ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Datum narození</span>
                    <span>{formatDate(selectedReservation.customerDateOfBirth)}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Věk</span>
                    <span>{calculateAgeFromDate(selectedReservation.customerDateOfBirth) ?? "-"}</span>
                  </div>
                </div>
              </section>

              <section className="reservation-detail-section">
                <h4>Rezervaci vytvořil</h4>
                <div className="reservation-detail-grid">
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Jméno zaměstnance</span>
                    <span>{selectedReservation.employeeName ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Uživatelské jméno</span>
                    <span>{selectedReservation.employeeUsername ?? "-"}</span>
                  </div>
                  <div className="reservation-detail-item">
                    <span className="reservation-detail-item__label">Role zaměstnance</span>
                    <span>{selectedReservation.employeeRole ?? "-"}</span>
                  </div>
                </div>
              </section>
            </div>

            {reservationActionStatus.message ? (
              <p
                className={`status status--${
                  reservationActionStatus.type === "idle" ? "neutral" : reservationActionStatus.type
                }`}
              >
                {reservationActionStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button className="btn btn--primary" type="button" onClick={submitReservationStatusUpdate}>
                Uložit stavy
              </button>
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => {
                  setReservationEditMode(true);
                  setReservationActionStatus({ type: "idle", message: "" });
                }}
              >
                Upravit
              </button>
              <button className="btn btn--danger" type="button" onClick={cancelReservation}>
                Zrušit rezervaci
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
