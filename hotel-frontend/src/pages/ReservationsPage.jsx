import { useMemo, useState } from "react";
import { useReservations } from "../queries/useReservations";
import { enrichReservation, formatDate, formatMoney, parseLocalDate } from "../utils/dashboardUtils";
import { PAYMENT_STATUSES, RESERVATION_SORT_FIELDS, RESERVATION_STATUSES, RESERVATIONS_PAGE_SIZE } from "../utils/dashboardConstants";
import { useRooms } from "../queries/useRooms";
import { useCustomers } from "../queries/useCustomers";
import { useEmployees } from "../queries/useEmployees";
import { useServices } from "../queries/useServices";
import ReservationModal from "../components/modals/ReservationModal";

export default function ReservationPage() {
  const { data: reservations, reservationsLoading, reservationsError } = useReservations();
  const { data: rooms, roomsLoading, roomsError } = useRooms();
  const { data: customers, customersLoading, customersError } = useCustomers();
  const { data: employees, employeesLoading, employeesError } = useEmployees();
  const { data: services, servicesLoading, servicesError } = useServices();

  const [reservationFilters, setReservationFilters] = useState({
    search: "",
    status: "ALL",
    paymentStatus: "ALL",
    roomNumber: "",
    fromDate: "",
    toDate: "",
  });
  const [reservationSort, setReservationSort] = useState({
    field: "checkInDate",
    direction: "desc",
  });
  const [reservationPage, setReservationPage] = useState(1);

  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  
  const openModal = (type, data = null) => setActiveModal({ type, data });
  const closeModal = () => setActiveModal({ type: null, data: null });

  const hydratedReservations = useMemo(
    () => {
      if (!reservations || !rooms || !customers || !employees || !services) return [];
      return reservations.map((reservation) => enrichReservation(reservation, rooms, customers, employees, services))
    },
    [reservations, rooms, customers, employees, services]
  );

  const filteredReservations = useMemo(() => {
    const normalizedSearch = reservationFilters.search.trim().toLowerCase();

    const filtered = hydratedReservations.filter((reservation) => {
      if (reservationFilters.status !== "ALL" && reservation.status !== reservationFilters.status) {
        return false;
      }
      if (
        reservationFilters.paymentStatus !== "ALL"
        && reservation.paymentStatus !== reservationFilters.paymentStatus
      ) {
        return false;
      }
      if (reservationFilters.roomNumber.trim()) {
        const roomVal = String(reservation.roomNumber ?? "").toLowerCase();
        const roomFilter = reservationFilters.roomNumber.trim().toLowerCase();
        if (!roomVal.includes(roomFilter)) {
          return false;
        }
      }
      if (reservationFilters.fromDate && reservation.checkInDate < reservationFilters.fromDate) {
        return false;
      }
      if (reservationFilters.toDate && reservation.checkOutDate > reservationFilters.toDate) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const searchable = [
        reservation.id,
        reservation.customerName,
        reservation.roomNumber,
        reservation.status,
        reservation.paymentStatus,
      ].map((value) => String(value ?? "").toLowerCase());

      return searchable.some((value) => value.includes(normalizedSearch));
    });

    return [...filtered].sort((a, b) => {
      const field = reservationSort.field;
      const direction = reservationSort.direction === "asc" ? 1 : -1;

      if (field === "checkInDate" || field === "checkOutDate") {
        const aDate = parseLocalDate(a[field])?.getTime() ?? 0;
        const bDate = parseLocalDate(b[field])?.getTime() ?? 0;
        return (aDate - bDate) * direction;
      }

      if (field === "id" || field === "roomNumber" || field === "totalPrice") {
        const aNum = Number(a[field] ?? 0);
        const bNum = Number(b[field] ?? 0);
        return (aNum - bNum) * direction;
      }

      const aText = String(a[field] ?? "").toLowerCase();
      const bText = String(b[field] ?? "").toLowerCase();
      return aText.localeCompare(bText, "cs") * direction;
    });
  }, [hydratedReservations, reservationFilters, reservationSort]);

  const pageStart = filteredReservations.length === 0 ? 0 : (reservationPage - 1) * RESERVATIONS_PAGE_SIZE + 1;
  const pageEnd = Math.min(reservationPage * RESERVATIONS_PAGE_SIZE, filteredReservations.length);

  const reservationTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredReservations.length / RESERVATIONS_PAGE_SIZE)),
    [filteredReservations.length]
  );

  const pagedReservations = useMemo(() => {
    const start = (reservationPage - 1) * RESERVATIONS_PAGE_SIZE;
    return filteredReservations.slice(start, start + RESERVATIONS_PAGE_SIZE);
  }, [filteredReservations, reservationPage]);

  function updateReservationFilter(field, value) {
    setReservationFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetReservationFilters() {
    setReservationFilters({
      search: "",
      status: "ALL",
      paymentStatus: "ALL",
      roomNumber: "",
      fromDate: "",
      toDate: "",
    });
    setReservationSort({
      field: "checkInDate",
      direction: "desc",
    });
    setReservationPage(1);
  }

  return (
    <section className="panel panel--wide">
      <section className="rooms-admin rooms-admin--standalone">
        <div className="rooms-admin__head">
          <h3>Správa rezervací</h3>
          <span className="rooms-admin__note">Kliknutím na řádek otevřete detail rezervace.</span>
        </div>

        {reservationsLoading || roomsLoading || customersLoading || employeesLoading || servicesLoading && <p className="panel__text">Načítání...</p>}
        {reservationsError && <p className="status status--error">{reservationsError.message}</p>}
        {roomsError && <p className="status status--error">{roomsError.message}</p>}
        {customersError && <p className="status status--error">{customersError.message}</p>}
        {employeesError && <p className="status status--error">{employeesError.message}</p>}
        {servicesError && <p className="status status--error">{servicesError.message}</p>}

        {(!reservationsLoading && !reservationsError && reservations) && (
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
                    <option value="ALL">Všechny</option>
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
                    <option value="ALL">Všechny</option>
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
                      onClick={() => openModal("RESERVATION", reservation)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal("RESERVATION", reservation);
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
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={8}>Filtru neodpovida zadna rezervace.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredReservations.length > 0 && (
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
                  Strana
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
            )}
          </>
        )}

        {activeModal.type === 'RESERVATION' && (
          <ReservationModal 
            key={activeModal.data?.id}
            onClose={closeModal}
            reservationId={activeModal.data?.id}
          />
        )}

      </section>
    </section>
  );
}