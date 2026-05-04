import { useMemo, useState } from "react";
import BaseModal from "./BaseModal";
import { createPortal } from "react-dom";
import { useEmployees } from "../../queries/useEmployees";
//delete payment statuses 
import { EMPLOYEE_ROLES, RESERVATION_STATUSES } from "../../utils/dashboardConstants";
import { useServices } from "../../queries/useServices";
import { calculateAgeFromDate, enrichReservation, formatDate, formatDateTime, formatMoney, normalizeServiceSelections, mapReservationServiceItems } from "../../utils/dashboardUtils";
import { useDeleteReservation, useEditReservation, useEditReservationStatus, useReservations } from "../../queries/useReservations";
import { useRooms } from "../../queries/useRooms";
import { useCustomers } from "../../queries/useCustomers";

import { useAuth } from "../../auth/AuthContext";// pro získání role uživatele a zobrazení některých informací pouze adminům
import { useCreatePayment, useReservationPaymentSummary } from "../../queries/usePayment";


export default function ReservationModal({reservationId, onClose}) {
  const { data: reservation, isLoading } = useReservations({
    select: (reservations) => reservations.find((r) => r.id === reservationId),
  });

  const { data: rooms } = useRooms();
  const { data: customers } = useCustomers();
  const { data: employees } = useEmployees();
  const { data: services } = useServices();

  const { mutate, isPending, error: mutationError } = useEditReservation();
  const { mutate: deleteReservation, isPending: deleteIsPending, error: deleteMutationError } = useDeleteReservation();
  const { mutate: editStatus, isPending: statusIsPending, error: statusMutationError } = useEditReservationStatus();

  const [editMode, setEditMode] = useState(false);
   
  const selectedReservation = useMemo(() => {
    if (!reservation || !rooms || !customers || !employees || !services) return reservation;
    return enrichReservation(reservation, rooms, customers, employees, services);
  }, [reservation, rooms, customers, employees, services]);

  const [form, setForm] = useState(() => {
    return {
      id: reservation.id ?? "",
      checkInDate: reservation.checkInDate ?? "",
      checkOutDate: reservation.checkOutDate ?? "",
      roomCapacity: reservation.roomCapacity ?? 50,
      numberOfGuests: reservation.numberOfGuests ?? 2,
      status: reservation.status ?? "PENDING",
      paymentStatus: reservation.paymentStatus ?? "UNPAID",
      specialRequests: reservation.specialRequests ?? "",
      serviceItems: mapReservationServiceItems(reservation.serviceItems),
    };
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const {
    data: paymentSummary,
    isLoading: paymentSummaryIsLoading,
    error: paymentSummaryError,
  } = useReservationPaymentSummary(reservationId);

  function toggleReservationService(serviceId, enabled) {
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

  function updateReservationServiceQuantity(serviceId, quantity) {
    setForm((prev) => ({
      ...prev,
      serviceItems: normalizeServiceSelections(prev.serviceItems).map((item) =>
        item.serviceId === String(serviceId)
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ),
    }));
  }

  const handleSubmit = () => {
    const payload = { 
      ...form,
      serviceItems: normalizeServiceSelections(form.serviceItems).map((item) => ({
        serviceId: Number(item.serviceId),
        quantity: Number(item.quantity),
      })),
    };

    setSuccessMessage("");
    setErrorMessage("");

    mutate(payload, {
      onSuccess: () => {
        setSuccessMessage("Rezervace byla úspěšně uložena.");
      }
    });
  }

  const handleStatusSubmit = () => {
    if (form.status === "CHECKED_IN") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkIn = new Date(`${selectedReservation.checkInDate}T00:00:00`);
      const checkOut = new Date(`${selectedReservation.checkOutDate}T00:00:00`);

      if (today < checkIn) {
        setErrorMessage("Rezervace muze byt označena jako 'CHECKED_IN' nejdříve v den začátku rezervace.");
        return;
      }

      if (today > checkOut) {
        setErrorMessage("Rezervace muze byt označena jako 'CHECKED_IN' nejpozději v den konce rezervace.");
        return;
      }
    }
    editStatus({
      id: reservationId, 
      status: form.status, 
    }, {
      onSuccess: () => {
        setSuccessMessage("Stavy rezervace byly úspěšně uloženy.");
      }
    });
  }

  //payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    method: "CARD",
    amount: "",
  });

  function updatePaymentForm(field, value) {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  }
  const { username } = useAuth();
  const currentEmployee = useMemo(
    () => employees?.find((employee) => employee.username === username),
    [employees, username]
  );
  const {
    mutate: createPayment,
    isPending: paymentIsPending,
    error: paymentMutationError,
  } = useCreatePayment();

  function handlePaymentSubmit() {
    createPayment(
      {
        reservationId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        employeeId: currentEmployee?.id,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Platba byla úspěšně přidána.");
          setShowPaymentForm(false);
          setPaymentForm({ method: "CARD", amount: "" });
        },
      }
    );
  }


  return createPortal((
    <BaseModal title={`Detail rezervace ${reservation.id}`} onClose={onClose}>
      {isLoading ? (
        <p>Načítání...</p>
      ) : (
        <>
          {/* reservation form */}
          {editMode ? (
            <>
              <div className="reservation-form-grid">
                <label>
                  <span>Začátek rezervace</span>
                  <input
                    type="date"
                    value={form.checkInDate}
                    onChange={(e) => updateForm("checkInDate", e.target.value)}
                  />
                </label>
                <label>
                  <span>Konec rezervace</span>
                  <input
                    type="date"
                    value={form.checkOutDate}
                    onChange={(e) => updateForm("checkOutDate", e.target.value)}
                  />
                </label>
                <label>
                  <span>Počet hostů</span>
                  <input
                    type="number"
                    min={1}
                    max={form.roomCapacity ?? 50}
                    value={form.numberOfGuests}
                    onChange={(e) => updateForm("numberOfGuests", e.target.value)}
                  />
                </label>
                <label>
                  <span>Stav rezervace</span>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
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
                  <div className="reservation-detail-item">
                      <strong>{selectedReservation.paymentStatus ?? "-"}</strong>
                    
                  </div>
                  {/* ///////// */}
                  <select
                    value={paymentForm.method}
                    onChange={(e) => updatePaymentForm("method", e.target.value)}
                  >
                    <option value="CARD">Karta</option>
                    <option value="CASH">Hotově</option>
                  </select>

                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={paymentForm.amount}
                    onChange={(e) => updatePaymentForm("amount", e.target.value)}
                  />

                  <button type="button" onClick={handlePaymentSubmit}>
                    Uložit platbu
                  </button>
                  {/* ///////// */}
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
                  {services.length === 0 ? (
                    <div className="customer-search-hint">Nejsou k dispozici žádné vytvořené služby.</div>
                  ) : (
                    <div className="new-customer-grid">
                      {services.map((service) => {
                        const selectedItem = normalizeServiceSelections(form.serviceItems).find(
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
                              min={0}
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
  
              {/* error message */}
              {mutationError && (
                <p className="status status--error">
                  {mutationError.message}
                </p>
              )}
              {paymentMutationError && (
                <p className="status status--error">
                  {paymentMutationError.message}
                </p>
              )}
              {errorMessage && (
                <p className="status status--error">
                  {errorMessage}
                </p>
              )}

              {/* success message */}
              {successMessage && (
                <p className="status status--success">
                  {successMessage}
                </p>
              )}
  
              <div className="reservation-actions">
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setSuccessMessage("");
                  }}
                >
                  Zpět
                </button>
                <button className="btn btn--primary" type="button" disabled={isPending} onClick={handleSubmit}>
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
                        value={form.status}
                        onChange={(e) => updateForm("status", e.target.value)}
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
                      <span>{selectedReservation.paymentStatus ?? "-"}</span>
                    </div>

                    <div className="reservation-detail-item">
                      <span className="reservation-detail-item__label">Zaplaceno</span>
                      <span>{paymentSummaryIsLoading ? "Načítání..." : formatMoney(paymentSummary?.amountPaid)}</span>
                    </div>

                    <div className="reservation-detail-item">
                      <span className="reservation-detail-item__label">Cena celkem</span>
                      <span>{formatMoney(selectedReservation.totalPrice)}</span>
                    </div>

                    <div className="reservation-detail-item">
                      <span className="reservation-detail-item__label">Zbývá doplatit</span>
                      <span>{paymentSummaryIsLoading ? "Načítání..." : formatMoney(paymentSummary?.remainingAmount)}</span>
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
  
              {/* error message */}
              {statusMutationError && (
                <p className="status status--error">
                  {statusMutationError.message}
                </p>
              )}

              {/* error message */}
              {deleteMutationError && (
                <p className="status status--error">
                  {deleteMutationError.message}
                </p>
              )}
              {errorMessage && (
                <p className="status status--error">
                  {errorMessage}
                </p>
              )}

              {/* success message */}
              {successMessage && (
                <p className="status status--success">
                  {successMessage}
                </p>
              )}
  
              <div className="reservation-actions">
                <button className="btn btn--primary" type="button" disabled={statusIsPending} onClick={handleStatusSubmit}>
                  Uložit stavy
                </button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => {
                    setEditMode(true);
                    setSuccessMessage("");
                  }}
                >
                  Upravit
                </button>
                <button className="btn btn--danger" type="button" disabled={deleteIsPending} onClick={() => {
                  deleteReservation(reservationId);
                  onClose();
                }}>
                  Zrušit rezervaci
                </button>
              </div>
            </>
          )}
        </>
      )}
    </BaseModal>
  ), document.body);
}
