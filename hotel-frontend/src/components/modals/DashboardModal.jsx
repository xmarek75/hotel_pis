import { useMemo, useState } from "react";
import { addDays, calculateAgeFromDate, calculateSelectedServicesTotal, formatDate, formatIsoDay, formatMoney, getRoomTypeName, normalizeServiceSelections, parseLocalDate } from "../../utils/dashboardUtils";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useServices } from "../../queries/useServices";
import { useCustomers, useUpsertCustomer } from "../../queries/useCustomers";
import { useCreateReservation } from "../../queries/useReservations";

export default function DashboardModal({createSlot, onClose}) {
  const { data: services } = useServices();
  const { data: customers } = useCustomers();

  const { mutate: createReservation, isPending: reservationPending, error: reservationError } = useCreateReservation();
  const { mutate: upsertCustomer, isPending: customerPending, error: cutomerError } = useUpsertCustomer();

  const [createStep, setCreateStep] = useState("form");
  const [customerSearch, setCustomerSearch] = useState("");
  const [createStatus, setCreateStatus] = useState({ type: "idle", message: "" });

  const [form, setForm] = useState({
    checkInDate: formatIsoDay(createSlot.day),
    checkOutDate: formatIsoDay(addDays(createSlot.day, 1)),
    numberOfGuests: 1,
    specialRequests: "",
    serviceItems: [],
    customerMode: "existing",
    existingCustomerId: "",
    newCustomerName: "",
    newCustomerDateOfBirth: "",
    newCustomerEmail: "",
    newCustomerPhone: "",
  });

  const createPreview = useMemo(() => {
    if (!createSlot) return null;
    const roomPrice = Number(createSlot.room?.pricePerNight ?? 0);
    const start = parseLocalDate(createSlot.startDateIso);
    const end = parseLocalDate(form.checkOutDate);
    const servicesTotal = calculateSelectedServicesTotal(form.serviceItems, services);
    if (!start || !end || !(end > start)) {
      return { nights: 0, roomTotal: 0, servicesTotal, total: servicesTotal, roomPrice };
    }
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((end - start) / msPerDay);
    const roomTotal = nights * roomPrice;
    return { nights, roomTotal, servicesTotal, total: roomTotal + servicesTotal, roomPrice };
  }, [form, createSlot, services]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers ?? [];
    return customers.filter((customer) => {
      const name = String(customer.name ?? "").toLowerCase();
      const email = String(customer.email ?? "").toLowerCase();
      const phone = String(customer.phone ?? "").toLowerCase();
      return [name, email, phone].some((value) => value.includes(query));
    }) ?? [];
  }, [customers, customerSearch]);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  function toggleCreateService(serviceId, enabled) {
    setForm((prev) => {
      const current = normalizeServiceSelections(prev.serviceItems);
      const normalizedId = String(serviceId);
      const exists = current.some((item) => item.serviceId === normalizedId);

      if (enabled && !exists) {
        return {
          ...prev,
          serviceItems: [...current, { serviceId: normalizedId, quantity: 1 }],
        };
      }
      if (!enabled && exists) {
        return {
          ...prev,
          serviceItems: current.filter((item) => item.serviceId !== normalizedId),
        };
      }
      return prev;
    });
  }

  function updateCreateServiceQuantity(serviceId, quantity) {
    setForm((prev) => ({
      ...prev,
      serviceItems: normalizeServiceSelections(prev.serviceItems).map((item) =>
        item.serviceId === String(serviceId)
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ),
    }));
  }

  function validateCreateForm() {
    const start = parseLocalDate(createSlot?.startDateIso);
    const end = parseLocalDate(form.checkOutDate);
    if (!start || !end || !(end > start)) {
      return "Konec rezervace musí být po datu začátku.";
    }
    const guests = Number(form.numberOfGuests);
    if (!guests || guests <= 0) {
      return "Počet hostů musí být větší než 0.";
    }
    if (guests > Number(createSlot?.room?.capacity ?? guests)) {
      return "Počet hostů překračuje kapacitu pokoje.";
    }
    if (form.customerMode === "existing" && !form.existingCustomerId) {
      return "Vyber existujícího zákazníka.";
    }
    if (form.customerMode === "new") {
      if (!form.newCustomerName.trim()) return "U nového zákazníka vyplň jméno.";
      if (!form.newCustomerDateOfBirth) return "U nového zákazníka vyplň datum narození.";
      if (!form.newCustomerEmail.trim()) return "U nového zákazníka vyplň e-mail.";
      if (!form.newCustomerPhone.trim()) return "U nového zákazníka vyplň telefon.";
      const age = calculateAgeFromDate(form.newCustomerDateOfBirth);
      if (age == null || age < 0) return "U nového zákazníka vyplň platné datum narození.";
    }
    return "";
  }

  const handleSubmit = () => {
    if (form.customerMode !== "existing") {
      const customerPayload = {
        name: form.newCustomerName.trim(),
        dateOfBirth: form.newCustomerDateOfBirth,
        email: form.newCustomerEmail.trim(),
        phone: form.newCustomerPhone.trim(),
      };
      upsertCustomer(customerPayload, {
        onSuccess: (data) => {
          const reservationPayload = {
            checkInDate: form.checkInDate,
            checkOutDate: form.checkOutDate,
            numberOfGuests: form.numberOfGuests,
            specialRequests: form.specialRequests,
            roomId: createSlot.room.id,
            customerId: data.id,
            serviceItems: form.serviceItems
          }
          createReservation(reservationPayload, { onSuccess: onClose });
        }
      });
      return;
    }
    
    const reservationPayload = {
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      numberOfGuests: form.numberOfGuests,
      specialRequests: form.specialRequests,
      roomId: createSlot.room.id,
      customerId: form.existingCustomerId,
      serviceItems: form.serviceItems
    }
    createReservation(reservationPayload, { onSuccess: onClose });
  }

  return createPortal((
    <BaseModal title={"Přidat rezervaci"} onClose={onClose}>
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
                value={form.checkOutDate}
                min={formatIsoDay(addDays(parseLocalDate(createSlot.startDateIso), 1))}
                onChange={(e) => updateForm("checkOutDate", e.target.value)}
              />
            </label>

            <label>
              <span>Počet hostů</span>
              <input
                type="number"
                min={1}
                max={createSlot.room.capacity ?? 10}
                value={form.numberOfGuests}
                onChange={(e) => updateForm("numberOfGuests", e.target.value)}
              />
            </label>

            <label className="reservation-form-grid__full">
              <span>Speciální požadavky</span>
              <textarea
                rows={2}
                value={form.specialRequests}
                onChange={(e) => updateForm("specialRequests", e.target.value)}
              />
            </label>

            <fieldset className="reservation-customer-box reservation-form-grid__full">
              <legend>Doplňkové služby</legend>
              {services?.length === 0 ? (
                <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
              ) : (
                <div className="new-customer-grid">
                  {services?.map((service) => {
                    const selectedItem = normalizeServiceSelections(form.serviceItems).find(
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
                    checked={form.customerMode === "existing"}
                    onChange={() => updateForm("customerMode", "existing")}
                  />
                  Existující zákazník
                </label>
                <label>
                  <input
                    type="radio"
                    name="customerMode"
                    checked={form.customerMode === "new"}
                    onChange={() => updateForm("customerMode", "new")}
                  />
                  Nový zákazník
                </label>
              </div>

              {form.customerMode === "existing" ? (
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
                      value={form.existingCustomerId}
                      onChange={(e) => updateForm("existingCustomerId", e.target.value)}
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
                      value={form.newCustomerName}
                      onChange={(e) => updateForm("newCustomerName", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Datum narození</span>
                    <input
                      type="date"
                      value={form.newCustomerDateOfBirth}
                      onChange={(e) => updateForm("newCustomerDateOfBirth", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>E-mail</span>
                    <input
                      type="email"
                      value={form.newCustomerEmail}
                      onChange={(e) => updateForm("newCustomerEmail", e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Telefon</span>
                    <input
                      value={form.newCustomerPhone}
                      onChange={(e) => updateForm("newCustomerPhone", e.target.value)}
                    />
                  </label>
                </div>
              )}
            </fieldset>

            {createStatus.message && (
              <p className={`status status--${createStatus.type === "idle" ? "neutral" : createStatus.type}`}>
                {createStatus.message}
              </p>
            )}

            <div className="reservation-form-grid__full reservation-actions">
              <button className="btn btn--secondary" type="button" onClick={onClose}>
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

        </>
      ) : (
        <div className="reservation-confirm">
          <h4>Potvrzení rezervace</h4>
          <div className="reservation-grid">
            <div><strong>Pokoj:</strong> {createSlot.room.number}</div>
            <div><strong>Typ pokoje:</strong> {getRoomTypeName(createSlot.room) || "-"}</div>
            <div><strong>Od:</strong> {formatDate(createSlot.startDateIso)}</div>
            <div><strong>Do:</strong> {formatDate(form.checkOutDate)}</div>
            <div><strong>Nocí:</strong> {createPreview?.nights ?? 0}</div>
            <div><strong>Cena za noc:</strong> {formatMoney(createPreview?.roomPrice)}</div>
            <div><strong>Pokoj celkem:</strong> {formatMoney(createPreview?.roomTotal)}</div>
            <div><strong>Služby celkem:</strong> {formatMoney(createPreview?.servicesTotal)}</div>
            <div><strong>Cena celkem:</strong> {formatMoney(createPreview?.total)}</div>
            <div><strong>Hostů:</strong> {form.numberOfGuests}</div>
            <div><strong>Zákazník:</strong> {form.customerMode === "existing"
              ? (customers?.find((c) => String(c.id) === String(form.existingCustomerId))?.name ?? "-")
              : (form.newCustomerName || "-")}</div>
            <div><strong>E-mail:</strong> {form.customerMode === "existing"
              ? (customers?.find((c) => String(c.id) === String(form.existingCustomerId))?.email ?? "-")
              : (form.newCustomerEmail || "-")}</div>
            <div><strong>Telefon:</strong> {form.customerMode === "existing"
              ? (customers?.find((c) => String(c.id) === String(form.existingCustomerId))?.phone ?? "-")
              : (form.newCustomerPhone || "-")}</div>
            <div className="reservation-form-grid__full"><strong>Poznámka:</strong> {form.specialRequests || "-"}</div>
            <div className="reservation-form-grid__full">
              <strong>Služby:</strong>{" "}
              {normalizeServiceSelections(form.serviceItems).length > 0
                ? normalizeServiceSelections(form.serviceItems).map((item) => {
                  const service = services.find((entry) => String(entry.id) === String(item.serviceId));
                  return `${service?.name ?? `#${item.serviceId}`} ${item.quantity}x`;
                }).join(", ")
                : "-"}
            </div>
          </div>

          {/* error message */}
          {cutomerError && (
            <p className="status status--error">
              {cutomerError.message}
            </p>
          )}

          {reservationError && (
            <p className="status status--error">
              {reservationError.message}
            </p>
          )}

          <div className="reservation-actions">
            <button className="btn btn--secondary" type="button" onClick={() => setCreateStep("form")}>
              Zpět
            </button>
            <button
              className="btn btn--primary"
              type="button"
              disabled={customerPending || reservationPending}
              onClick={handleSubmit}
            >
              Potvrdit rezervaci
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  ), document.body);
}