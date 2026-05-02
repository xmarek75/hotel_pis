import React from "react";
import {
  addDays,
  formatDate,
  formatIsoDay,
  formatMoney,
  getRoomTypeName,
  normalizeServiceSelections,
  parseLocalDate,
} from "../dashboardUtils";

export default function ReservationCreateModal({
  createSlot,
  closeCreateReservation,
  createStep,
  createStatus,
  createForm,
  updateCreateForm,
  services,
  toggleCreateService,
  updateCreateServiceQuantity,
  customerSearch,
  setCustomerSearch,
  filteredCustomers,
  validateCreateForm,
  setCreateStatus,
  setCreateStep,
  submitReservationCreate,
  createPreview,
  customers,
}) {
  if (!createSlot) return null;

  return (
    <div className="reservation-modal-backdrop" onClick={closeCreateReservation}>
      <section
        className="reservation-modal"
        onClick={(e) => e.stopPropagation()}
        aria-label="Vytvoření rezervace"
      >
        <header className="reservation-modal__head">
          <h3>Nová rezervace - pokoj {createSlot.room.number}</h3>
          <button className="btn btn--secondary btn--compact" type="button" onClick={closeCreateReservation}>
            Zavřít
          </button>
        </header>

        {createStep === "form" ? (
          <>
            <div className="reservation-form-grid">
              <label>
                <span>Začátek rezervace</span>
                <input type="date" value={createSlot.startDateIso} disabled />
              </label>

              <label>
                <span>Konec rezervace</span>
                <input
                  type="date"
                  value={createForm.checkOutDate}
                  min={formatIsoDay(addDays(parseLocalDate(createSlot.startDateIso), 1))}
                  onChange={(e) => updateCreateForm("checkOutDate", e.target.value)}
                />
              </label>

              <label>
                <span>Počet hostů</span>
                <input
                  type="number"
                  min={1}
                  max={createSlot.room.capacity ?? 10}
                  value={createForm.numberOfGuests}
                  onChange={(e) => updateCreateForm("numberOfGuests", e.target.value)}
                />
              </label>

              <label className="reservation-form-grid__full">
                <span>Speciální požadavky</span>
                <textarea
                  rows={2}
                  value={createForm.specialRequests}
                  onChange={(e) => updateCreateForm("specialRequests", e.target.value)}
                />
              </label>

              <fieldset className="reservation-customer-box reservation-form-grid__full">
                <legend>Doplňkové služby</legend>
                {services.length === 0 ? (
                  <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
                ) : (
                  <div className="new-customer-grid">
                    {services.map((service) => {
                      const selectedItem = normalizeServiceSelections(createForm.serviceItems).find(
                        (item) => item.serviceId === String(service.id)
                      );
                      return (
                        <label key={`create-service-${service.id}`}>
                          <span>
                            <input
                              type="checkbox"
                              checked={!!selectedItem}
                              onChange={(e) => toggleCreateService(service.id, e.target.checked)}
                            />
                            {" "}
                            {service.name} ({formatMoney(service.price)})
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={selectedItem?.quantity ?? 1}
                            disabled={!selectedItem}
                            onChange={(e) => updateCreateServiceQuantity(service.id, e.target.value)}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <fieldset className="reservation-customer-box reservation-form-grid__full">
                <legend>Zákazník</legend>
                <div className="customer-mode-row">
                  <label>
                    <input
                      type="radio"
                      name="customerMode"
                      checked={createForm.customerMode === "existing"}
                      onChange={() => updateCreateForm("customerMode", "existing")}
                    />
                    Existující zákazník
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="customerMode"
                      checked={createForm.customerMode === "new"}
                      onChange={() => updateCreateForm("customerMode", "new")}
                    />
                    Nový zákazník
                  </label>
                </div>

                {createForm.customerMode === "existing" ? (
                  <>
                    <label>
                      <span>Hledat zákazníka</span>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Jméno, e-mail nebo telefon"
                      />
                    </label>
                    <label>
                      <span>Vyber zákazníka ({filteredCustomers.length})</span>
                      <select
                        value={createForm.existingCustomerId}
                        onChange={(e) => updateCreateForm("existingCustomerId", e.target.value)}
                      >
                        <option value="">-- Vyber --</option>
                        {filteredCustomers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email ?? "-"} | {c.phone ?? "-"})
                          </option>
                        ))}
                      </select>
                    </label>
                    {customerSearch.trim() && filteredCustomers.length === 0 ? (
                      <div className="customer-search-hint">Pro zadaný dotaz nebyl nalezen žádný zákazník.</div>
                    ) : null}
                  </>
                ) : (
                  <div className="new-customer-grid">
                    <label>
                      <span>Jméno</span>
                      <input
                        value={createForm.newCustomerName}
                        onChange={(e) => updateCreateForm("newCustomerName", e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Datum narození</span>
                      <input
                        type="date"
                        value={createForm.newCustomerDateOfBirth}
                        onChange={(e) => updateCreateForm("newCustomerDateOfBirth", e.target.value)}
                      />
                    </label>
                    <label>
                      <span>E-mail</span>
                      <input
                        type="email"
                        value={createForm.newCustomerEmail}
                        onChange={(e) => updateCreateForm("newCustomerEmail", e.target.value)}
                      />
                    </label>
                    <label>
                      <span>Telefon</span>
                      <input
                        value={createForm.newCustomerPhone}
                        onChange={(e) => updateCreateForm("newCustomerPhone", e.target.value)}
                      />
                    </label>
                  </div>
                )}
              </fieldset>

              <div className="reservation-form-grid__full reservation-actions">
                <button className="btn btn--secondary" type="button" onClick={closeCreateReservation}>
                  Zrušit
                </button>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => {
                    const validationError = validateCreateForm();
                    if (validationError) {
                      setCreateStatus({ type: "error", message: validationError });
                      return;
                    }
                    setCreateStatus({ type: "idle", message: "" });
                    setCreateStep("confirm");
                  }}
                >
                  Pokračovat na potvrzení
                </button>
              </div>
            </div>
            {createStatus.message ? (
              <p className={`status status--${createStatus.type === "idle" ? "neutral" : createStatus.type}`}>
                {createStatus.message}
              </p>
            ) : null}
          </>
        ) : (
          <div className="reservation-confirm">
            <h4>Potvrzení rezervace</h4>
            <div className="reservation-grid">
              <div><strong>Pokoj:</strong> {createSlot.room.number}</div>
              <div><strong>Typ pokoje:</strong> {getRoomTypeName(createSlot.room) || "-"}</div>
              <div><strong>Od:</strong> {formatDate(createSlot.startDateIso)}</div>
              <div><strong>Do:</strong> {formatDate(createForm.checkOutDate)}</div>
              <div><strong>Nocí:</strong> {createPreview?.nights ?? 0}</div>
              <div><strong>Cena za noc:</strong> {formatMoney(createPreview?.roomPrice)}</div>
              <div><strong>Pokoj celkem:</strong> {formatMoney(createPreview?.roomTotal)}</div>
              <div><strong>Služby celkem:</strong> {formatMoney(createPreview?.servicesTotal)}</div>
              <div><strong>Cena celkem:</strong> {formatMoney(createPreview?.total)}</div>
              <div><strong>Hostů:</strong> {createForm.numberOfGuests}</div>
              <div><strong>Zákazník:</strong> {createForm.customerMode === "existing"
                ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.name ?? "-")
                : (createForm.newCustomerName || "-")}</div>
              <div><strong>E-mail:</strong> {createForm.customerMode === "existing"
                ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.email ?? "-")
                : (createForm.newCustomerEmail || "-")}</div>
              <div><strong>Telefon:</strong> {createForm.customerMode === "existing"
                ? (customers.find((c) => String(c.id) === String(createForm.existingCustomerId))?.phone ?? "-")
                : (createForm.newCustomerPhone || "-")}</div>
              <div className="reservation-form-grid__full"><strong>Poznámka:</strong> {createForm.specialRequests || "-"}</div>
              <div className="reservation-form-grid__full">
                <strong>Služby:</strong>{" "}
                {normalizeServiceSelections(createForm.serviceItems).length > 0
                  ? normalizeServiceSelections(createForm.serviceItems).map((item) => {
                    const service = services.find((entry) => String(entry.id) === String(item.serviceId));
                    return `${service?.name ?? `#${item.serviceId}`} ${item.quantity}x`;
                  }).join(", ")
                  : "-"}
              </div>
            </div>

            {createStatus.message ? (
              <p className={`status status--${createStatus.type === "idle" ? "neutral" : createStatus.type}`}>
                {createStatus.message}
              </p>
            ) : null}

            <div className="reservation-actions">
              <button className="btn btn--secondary" type="button" onClick={() => setCreateStep("form")}>
                Zpět
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  const validationError = validateCreateForm();
                  if (validationError) {
                    setCreateStatus({ type: "error", message: validationError });
                    return;
                  }
                  submitReservationCreate();
                }}
              >
                Potvrdit rezervaci
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
